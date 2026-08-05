-- Web Push: subscriptions per device, service-role RPC for the VAPID keys in
-- Vault, and a trigger that fans every new notification out to the send-push
-- edge function via pg_net.
--
-- NOTE: before (or after) running this, create the Vault secret with the VAPID
-- key pair — NOT committed here because the private key is a credential:
--   select vault.create_secret('<vapid-jwk-json>', 'vapid_jwk');

create extension if not exists pg_net with schema extensions;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy push_sub_select_own on public.push_subscriptions
  for select using (user_id = auth.uid());
create policy push_sub_insert_own on public.push_subscriptions
  for insert with check (user_id = auth.uid());
create policy push_sub_update_own on public.push_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_sub_delete_own on public.push_subscriptions
  for delete using (user_id = auth.uid());

create or replace function public.get_vapid_keys()
returns text
language sql security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_jwk';
$$;

revoke all on function public.get_vapid_keys() from public;
revoke all on function public.get_vapid_keys() from anon;
revoke all on function public.get_vapid_keys() from authenticated;
grant execute on function public.get_vapid_keys() to service_role;

-- Fan out every new notification to the edge function (fire-and-forget)
create or replace function public.push_on_notification()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://nkurrrzqwgjwwtnjnluk.supabase.co/functions/v1/send-push',
    body := jsonb_build_object('notification_id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$$;

create trigger on_notification_push
  after insert on public.notifications
  for each row execute function public.push_on_notification();
