-- Applied 2026-10-07.
-- phone_confirmed mirrors Supabase Auth: true only when the account's phone was verified by SMS
-- and matches profiles.phone. Users can't write the column (column grants), only this trigger can.
create function private.sync_phone_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.phone_confirmed := coalesce((
    select u.phone_confirmed_at is not null
       and u.phone = regexp_replace(coalesce(new.phone, ''), '\D', '', 'g')
    from auth.users u
    where u.id = new.id
  ), false);
  return new;
end;
$$;

revoke all on function private.sync_phone_confirmed() from public, anon, authenticated;

create trigger profiles_phone_confirmed
before insert or update on public.profiles
for each row execute function private.sync_phone_confirmed();
