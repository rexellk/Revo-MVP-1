-- Applied 2026-10-07.
-- Services a Revivor offers, with their price range. Source of truth for the Dashboard and,
-- later, what drivers see. revivor_profiles.services is now only the onboarding snapshot.
create table public.revivor_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  service text not null check (service in ('oil', 'brakes', 'battery', 'bulbs', 'tires')),
  price_min int not null default 0 check (price_min >= 0), -- 0 = price not set yet
  price_max int not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_range check (price_max >= price_min),
  constraint one_listing_per_service unique (user_id, service)
);

create trigger revivor_listings_updated_at before update on public.revivor_listings
for each row execute function private.set_updated_at();

alter table public.revivor_listings enable row level security;
revoke all on public.revivor_listings from anon, authenticated;
grant select, insert, update, delete on public.revivor_listings to authenticated;

-- Same visibility as the profile: yourself always, others only once you're verified.
create policy "Listings follow profile visibility" on public.revivor_listings
for select to authenticated
using (user_id = (select auth.uid()) or private.is_verified_revivor(user_id));
create policy "Revivors add their own listings" on public.revivor_listings
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Revivors edit their own listings" on public.revivor_listings
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Revivors remove their own listings" on public.revivor_listings
for delete to authenticated using (user_id = (select auth.uid()));

-- Carry over services picked during onboarding as "price not set" rows.
insert into public.revivor_listings (user_id, service)
select rp.user_id, svc
from public.revivor_profiles rp, unnest(rp.services) as svc
where svc in ('oil', 'brakes', 'battery', 'bulbs', 'tires')
on conflict (user_id, service) do nothing;
