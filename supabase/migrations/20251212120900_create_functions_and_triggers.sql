-- migration: create database functions and triggers
-- purpose: automate common tasks like timestamp updates and profile creation
-- affected: profiles, platforms, creators tables
-- considerations: triggers run automatically, security definer for elevated privileges

-- function: handle_updated_at
-- purpose: automatically update the updated_at timestamp on row updates
-- usage: attached to tables via triggers
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- set updated_at to current timestamp
  new.updated_at = now();
  return new;
end;
$$;

-- trigger: update profiles.updated_at on row update
create trigger trg_profiles_updated
  before update on profiles
  for each row
  execute function handle_updated_at();

-- trigger: update platforms.updated_at on row update
create trigger trg_platforms_updated
  before update on platforms
  for each row
  execute function handle_updated_at();

-- trigger: update creators.updated_at on row update
create trigger trg_creators_updated
  before update on creators
  for each row
  execute function handle_updated_at();

-- function: create_profile_for_new_user
-- purpose: automatically create a profile when a new user signs up
-- security definer: allows function to bypass rls and insert profile
-- usage: triggered after insert on auth.users
create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- insert a new profile record linked to the new user
  -- uses default values for country_code ('PL') and onboarding_status ('not_started')
  insert into public.profiles (user_id)
  values (new.id);
  
  return new;
end;
$$;

-- trigger: create profile after user registration
-- runs after a new user is inserted into auth.users
-- ensures every user has a corresponding profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_profile_for_new_user();

