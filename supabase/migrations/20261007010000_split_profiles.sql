-- Split account + public profile data out of verification_submissions.
--   profiles               private: legal name, phone. Owner + REVO team only.
--   revivor_profiles       what drivers see. Readable once the Revivor is verified (owner can always read).
--   verification_submissions  one row per review attempt. Docs + statuses.
--   review_queue (view)    everything the REVO team needs for a pending review, in one row.

create schema if not exists private;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles (private account data) ----------
create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('driver', 'revivor')),
  legal_name text,
  phone text,
  phone_confirmed boolean not null default false, -- true only once real SMS login exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- Column grants: users can never write phone_confirmed.
grant insert (id, role, legal_name, phone) on public.profiles to authenticated;
-- id is included so upserts work; RLS keeps it pinned to the caller.
grant update (id, role, legal_name, phone) on public.profiles to authenticated;

create policy "Users read their own account" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "Users create their own account" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));
create policy "Users update their own account" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- verified check (not exposed through the API) ----------
create function private.is_verified_revivor(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select s.id_status = 'verified' and s.ase_status = 'verified'
    from public.verification_submissions s
    where s.user_id = uid
    order by s.created_at desc
    limit 1
  ), false);
$$;

revoke all on function private.is_verified_revivor(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_verified_revivor(uuid) to authenticated;

-- ---------- revivor_profiles (what drivers see) ----------
create table public.revivor_profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null,           -- "Sammy L."
  photo_path text,                      -- in the "profile-photos" bucket
  bio text not null,
  area text not null,
  radius_miles int not null,
  years_experience int not null,
  services text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger revivor_profiles_updated_at before update on public.revivor_profiles
for each row execute function private.set_updated_at();

alter table public.revivor_profiles enable row level security;
revoke all on public.revivor_profiles from anon, authenticated;
grant select on public.revivor_profiles to authenticated;
grant insert (user_id, display_name, photo_path, bio, area, radius_miles, years_experience, services) on public.revivor_profiles to authenticated;
grant update (user_id, display_name, photo_path, bio, area, radius_miles, years_experience, services) on public.revivor_profiles to authenticated;

-- Trust rule: unverified Revivors are hidden from everyone but themselves.
create policy "Verified Revivors are visible, and you can always see yourself" on public.revivor_profiles
for select to authenticated
using (user_id = (select auth.uid()) or private.is_verified_revivor(user_id));
create policy "Revivors create their own profile" on public.revivor_profiles
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Revivors update their own profile" on public.revivor_profiles
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- profile photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']);

create policy "Revivors upload their own profile photo"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- A photo is readable when its profile is readable (yours, or a verified Revivor's).
create policy "Profile photos follow profile visibility"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-photos'
  and exists (select 1 from public.revivor_profiles rp where rp.photo_path = storage.objects.name)
);

-- ---------- verification_submissions: profile data now lives in the tables above ----------
-- The old full_name / area / years_experience / bio columns are kept (unused) so this
-- migration deletes nothing. full_name is made optional because the app no longer sends it.
-- To clean up later: alter table public.verification_submissions drop column full_name,
--   drop column area, drop column years_experience, drop column bio;
alter table public.verification_submissions alter column full_name drop not null;

-- ---------- review_queue: one row per pending review, for the REVO team ----------
create view public.review_queue
with (security_invoker = on)
as
select
  s.id as submission_id,
  s.created_at as submitted_at,
  p.legal_name,
  rp.display_name,
  p.phone,
  p.phone_confirmed,
  rp.area,
  rp.years_experience,
  rp.photo_path as profile_photo_path,
  s.id_photo_path,
  s.selfie_path,
  s.ase_certificates,
  s.work_photo_paths,
  s.intro_video_path,
  s.id_status,
  s.ase_status,
  s.reviewer_note,
  s.user_id
from public.verification_submissions s
left join public.profiles p on p.id = s.user_id
left join public.revivor_profiles rp on rp.user_id = s.user_id
where s.id_status = 'in_review' or s.ase_status = 'in_review'
order by s.created_at;

revoke all on public.review_queue from anon, authenticated;

-- ---------- allow scanned PDFs (IDs, ASE certificates) from the Files app ----------
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/pdf')
where id = 'verification-docs' and not ('application/pdf' = any (allowed_mime_types));
