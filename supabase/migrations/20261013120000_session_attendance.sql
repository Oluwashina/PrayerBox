-- Attendance: one row per person per session, written when they enter the room.
-- Guests are identified by their signed device credential, so rejoining from the
-- same device updates the existing row instead of counting them twice.
create table public.session_attendance (
  session_id uuid not null references public.prayer_sessions (id) on delete cascade,
  identity text not null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  is_host boolean not null default false,
  first_joined_at timestamptz not null default now(),
  last_joined_at timestamptz not null default now(),
  join_count integer not null default 1,
  primary key (session_id, identity)
);

alter table public.session_attendance enable row level security;

create policy "hosts read attendance" on public.session_attendance
  for select to authenticated using (public.is_host());

revoke all on public.session_attendance from anon;
revoke insert, update, delete on public.session_attendance from authenticated;

-- Called by the room-token function (service role) each time someone enters.
create or replace function public.record_attendance(
  p_session_id uuid,
  p_identity text,
  p_display_name text,
  p_is_host boolean
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.session_attendance (session_id, identity, display_name, is_host)
  values (p_session_id, p_identity, p_display_name, p_is_host)
  on conflict (session_id, identity) do update
    set display_name = excluded.display_name,
        is_host = excluded.is_host,
        last_joined_at = now(),
        join_count = public.session_attendance.join_count + 1;
$$;

revoke execute on function public.record_attendance(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.record_attendance(uuid, text, text, boolean) to service_role;

-- Per-session attendee counts for the host console. Runs with the caller's
-- rights, so the RLS policy above limits it to hosts.
create or replace function public.session_attendance_counts()
returns table (session_id uuid, attendees integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select a.session_id, count(*)::integer
  from public.session_attendance a
  group by a.session_id;
$$;

revoke execute on function public.session_attendance_counts() from public, anon;
grant execute on function public.session_attendance_counts() to authenticated;
