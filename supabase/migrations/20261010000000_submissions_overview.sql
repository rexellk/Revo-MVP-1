-- Applied 2026-10-10.
-- Every submission (any status) with who it belongs to, for the REVO team.
-- review_queue stays the pending-only list.
create view public.submissions_overview
with (security_invoker = on)
as
select
  s.id as submission_id,
  s.created_at as submitted_at,
  p.legal_name,
  rp.display_name,
  p.phone,
  s.id_status,
  s.ase_status,
  s.reviewer_note,
  s.reviewed_by,
  s.reviewed_at,
  s.user_id
from public.verification_submissions s
left join public.profiles p on p.id = s.user_id
left join public.revivor_profiles rp on rp.user_id = s.user_id
order by s.created_at desc;

revoke all on public.submissions_overview from anon, authenticated;
