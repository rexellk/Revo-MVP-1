-- Run by hand in the Supabase SQL Editor (Claude's tools can't run DROP).
-- These were replaced by profiles / revivor_profiles in 20261007010000 and are always NULL.
alter table public.verification_submissions
  drop column if exists full_name,
  drop column if exists area,
  drop column if exists years_experience,
  drop column if exists bio;
