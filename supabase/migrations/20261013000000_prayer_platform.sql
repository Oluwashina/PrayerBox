-- Prayer platform schema: sessions, host allow-list, speaker grants, bans.

create type public.session_status as enum ('scheduled', 'live', 'ended', 'cancelled');
create type public.session_mode as enum ('broadcast', 'interactive');

-- Only users listed here are hosts. Rows are added by an administrator (SQL editor
-- or service role); there is no client-side write access.
create table public.hosts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.prayer_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  prayer_focus text not null check (char_length(prayer_focus) between 1 and 120),
  host_name text not null check (char_length(host_name) between 1 and 60),
  scheduled_start timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  mode public.session_mode not null default 'broadcast',
  status public.session_status not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prayer_sessions_status_start_idx on public.prayer_sessions (status, scheduled_start);

-- Guests approved to speak in interactive mode. Read by the token endpoint so
-- permission survives a reconnect. Service role only.
create table public.session_speakers (
  session_id uuid not null references public.prayer_sessions (id) on delete cascade,
  identity text not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (session_id, identity)
);

-- Participants removed by a host. Token requests for these identities are refused.
create table public.session_bans (
  session_id uuid not null references public.prayer_sessions (id) on delete cascade,
  identity text not null,
  banned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (session_id, identity)
);

create or replace function public.is_host()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.hosts h where h.user_id = auth.uid());
$$;

-- Enforce valid lifecycle transitions and timestamps for every writer.
create or replace function public.prayer_sessions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if new.status <> 'scheduled' then
      raise exception 'New sessions must start as scheduled';
    end if;
    new.started_at := null;
    new.ended_at := null;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'scheduled' and new.status in ('live', 'cancelled')) or
      (old.status = 'live' and new.status = 'ended')
    ) then
      raise exception 'Invalid status change from % to %', old.status, new.status;
    end if;
    if new.status = 'live' then new.started_at := now(); new.ended_at := null; end if;
    if new.status = 'ended' then new.ended_at := now(); end if;
  else
    new.started_at := old.started_at;
    new.ended_at := old.ended_at;
  end if;

  if old.status in ('ended', 'cancelled') and (
    new.title, new.description, new.prayer_focus, new.host_name, new.scheduled_start, new.duration_minutes, new.mode
  ) is distinct from (
    old.title, old.description, old.prayer_focus, old.host_name, old.scheduled_start, old.duration_minutes, old.mode
  ) then
    raise exception 'Finished sessions cannot be edited';
  end if;

  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger prayer_sessions_guard
before insert or update on public.prayer_sessions
for each row execute function public.prayer_sessions_guard();

alter table public.hosts enable row level security;
alter table public.prayer_sessions enable row level security;
alter table public.session_speakers enable row level security;
alter table public.session_bans enable row level security;

-- Hosts can see their own host record (used to confirm host status after sign-in).
create policy "hosts read own row" on public.hosts
  for select to authenticated using (user_id = auth.uid());

-- Session metadata is public so shared links work without an account.
create policy "anyone reads sessions" on public.prayer_sessions
  for select to anon, authenticated using (true);

create policy "hosts create sessions" on public.prayer_sessions
  for insert to authenticated with check (public.is_host());

-- Hosts may edit details and cancel. Going live / ending goes through the
-- session-control function so the LiveKit room is managed at the same time.
create policy "hosts update sessions" on public.prayer_sessions
  for update to authenticated using (public.is_host())
  with check (public.is_host() and status in ('scheduled', 'cancelled'));

-- session_speakers and session_bans have no policies: only the service role can access them.

revoke all on public.session_speakers from anon, authenticated;
revoke all on public.session_bans from anon, authenticated;
revoke insert, update, delete on public.hosts from anon, authenticated;
revoke delete on public.prayer_sessions from anon, authenticated;

alter publication supabase_realtime add table public.prayer_sessions;
