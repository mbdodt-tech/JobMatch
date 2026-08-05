-- Applied 2026-08-05 via MCP (two steps: enum value must commit first).

-- Step 1 (migration: add_unmatched_status)
alter type match_status add value if not exists 'unmatched';

-- Step 2 (migration: unmatch_flow)
-- Unmatch flow: either party can dissolve an active match with an open reason.
-- The reason is visible to the other party (product decision 2026-08-05).

alter table public.matches
  add column if not exists unmatched_at timestamptz,
  add column if not exists unmatched_by uuid references public.profiles(id),
  add column if not exists unmatch_reason text,
  add column if not exists unmatch_note text;

-- Both parties may update their own match (used for the unmatch transition)
create policy match_update_student on public.matches
  for update using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy match_update_manager on public.matches
  for update using (
    store_id in (select id from public.stores where manager_id = auth.uid())
  )
  with check (
    store_id in (select id from public.stores where manager_id = auth.uid())
  );

-- Chat hard-lock: new messages require the match to still be active.
-- (SELECT keeps using is_match_participant so history stays readable.)
create or replace function public.is_active_match_participant(p_match_id uuid)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from matches m
    join stores s on s.id = m.store_id
    where m.id = p_match_id
      and m.status = 'active'
      and (m.student_id = auth.uid() or s.manager_id = auth.uid())
  );
$$;

drop policy message_insert_participant on public.messages;
create policy message_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid() and is_active_match_participant(match_id)
  );

-- Notify the other party when a match is dissolved; reason is included openly.
create or replace function public.notify_on_unmatch()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_student_name text;
  v_store_name text;
  v_manager_id uuid;
  v_reason text;
begin
  if old.status = 'active' and new.status::text = 'unmatched' then
    select p.full_name into v_student_name from profiles p where p.id = new.student_id;
    select s.name, s.manager_id into v_store_name, v_manager_id from stores s where s.id = new.store_id;
    v_reason := case
      when new.unmatch_reason is not null then ' Årsag: ' || new.unmatch_reason
      else ''
    end;

    if new.unmatched_by = new.student_id then
      if v_manager_id is not null then
        insert into notifications (user_id, type, title, body, link) values
          (v_manager_id, 'unmatch', 'Match ophævet',
           coalesce(v_student_name, 'En elev') || ' har ophævet jeres match.' || v_reason,
           '/manager/matches');
      end if;
    else
      insert into notifications (user_id, type, title, body, link) values
        (new.student_id, 'unmatch', 'Match ophævet',
         coalesce(v_store_name, 'Butikken') || ' har ophævet jeres match.' || v_reason,
         '/student/matches');
    end if;
  end if;
  return new;
end;
$$;

create trigger on_match_unmatch
  after update on public.matches
  for each row execute function public.notify_on_unmatch();
