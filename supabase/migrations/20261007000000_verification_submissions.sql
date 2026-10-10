-- Applied 2026-10-07. MVP1: a Revivor submits ID + selfie + ASE evidence; the REVO team reviews it in the Supabase dashboard.
create type public.check_status as enum ('in_review', 'verified', 'rejected');

create table public.verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name text not null,
  area text,
  years_experience int,
  bio text,
  -- Storage paths in the private "verification-docs" bucket
  id_photo_path text not null,
  selfie_path text not null,
  ase_certificates jsonb not null default '[]'::jsonb, -- [{ "name": "...", "path": "..." }]
  work_photo_paths text[] not null default '{}',
  intro_video_path text,
  -- Set only by the REVO team
  id_status public.check_status not null default 'in_review',
  ase_status public.check_status not null default 'in_review',
  reviewer_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ase_required check (jsonb_array_length(ase_certificates) >= 1)
);

create index verification_submissions_user_idx on public.verification_submissions (user_id, created_at desc);

alter table public.verification_submissions enable row level security;

revoke all on public.verification_submissions from anon;
grant select, insert on public.verification_submissions to authenticated;

-- Revivors can only submit for themselves, and only as "in review". They can never set their own badge.
create policy "Revivors submit their own evidence"
on public.verification_submissions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and id_status = 'in_review'
  and ase_status = 'in_review'
  and reviewer_note is null
  and reviewed_by is null
  and reviewed_at is null
);

create policy "Revivors read their own submissions"
on public.verification_submissions for select to authenticated
using (user_id = (select auth.uid()));

-- No update/delete policies: only the REVO team (dashboard / service role) changes statuses.

create function public.stamp_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id_status is distinct from old.id_status or new.ase_status is distinct from old.ase_status then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger verification_submissions_stamp_review
before update on public.verification_submissions
for each row execute function public.stamp_review();

-- Private bucket: ID photos and selfies are only visible to the REVO team.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-docs',
  'verification-docs',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'video/mp4', 'video/quicktime']
);

-- Revivors may upload only into a folder named after their own user id. No read policy: they can't list or download.
create policy "Revivors upload into their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'verification-docs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
