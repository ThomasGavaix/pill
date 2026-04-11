-- Add calendar_token to profiles for secure webcal subscription
alter table profiles
  add column calendar_token uuid default gen_random_uuid() not null;
