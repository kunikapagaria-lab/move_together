-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- TRIGGER FOR NEW USER PROFILE
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CHALLENGE GROUPS
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  status text default 'waiting' check (status in ('waiting', 'active', 'completed')),
  start_date timestamp with time zone,
  group_streak integer default 0,
  owner_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.groups enable row level security;

create policy "Groups are viewable by everyone (for invite codes)." on public.groups
  for select using (true);

create policy "Authenticated users can create groups." on public.groups
  for insert with check (auth.uid() = owner_id);

create policy "Group owners can update their groups." on public.groups
  for update using (auth.uid() = owner_id);

-- GROUP MEMBERS
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Members can view other members in their groups." on public.group_members
  for select using (
    auth.uid() in (
      select user_id from public.group_members where group_id = public.group_members.group_id
    )
  );

create policy "Authenticated users can join groups." on public.group_members
  for insert with check (auth.uid() = user_id);
