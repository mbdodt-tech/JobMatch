-- Undo-swipe support: mirror the INSERT policies as DELETE policies so each
-- party can retract their own swipe (and the match it created).
-- Without these, the undo buttons in student/feed and manager/feed silently
-- delete 0 rows (RLS blocks DELETE, Supabase reports no error).

create policy swipe_delete_student on public.swipes
  for delete using (
    swiper_role = 'student'::user_role and profile_id = auth.uid()
  );

create policy swipe_delete_manager on public.swipes
  for delete using (
    swiper_role = 'store_manager'::user_role
    and store_id in (select id from public.stores where manager_id = auth.uid())
  );

create policy match_delete_student on public.matches
  for delete using (student_id = auth.uid());

create policy match_delete_manager on public.matches
  for delete using (
    store_id in (select id from public.stores where manager_id = auth.uid())
  );
