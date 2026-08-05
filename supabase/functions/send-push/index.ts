// send-push — delivers a notification row as Web Push to the user's devices.
// Invoked by the on_notification_push trigger (pg_net) with {notification_id}.
// Safe to expose without JWT: it can only deliver an EXISTING notification row
// to its rightful owner, and only if the owner has notify_push enabled.

import { createClient } from 'npm:@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush@0.3';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  try {
    const { notification_id } = await req.json().catch(() => ({}));
    if (!notification_id) return json({ error: 'notification_id mangler' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: notification } = await supabase
      .from('notifications')
      .select('id, user_id, title, body, link')
      .eq('id', notification_id)
      .maybeSingle();
    if (!notification) return json({ error: 'notifikation findes ikke' }, 404);

    const { data: profile } = await supabase
      .from('profiles')
      .select('notify_push')
      .eq('id', notification.user_id)
      .maybeSingle();
    if (!profile?.notify_push) return json({ sent: 0, reason: 'push slået fra' });

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', notification.user_id);
    if (!subs || subs.length === 0) return json({ sent: 0, reason: 'ingen enheder' });

    const { data: vapidJson, error: vapidError } = await supabase.rpc('get_vapid_keys');
    if (vapidError || !vapidJson) return json({ error: 'VAPID-nøgler mangler i Vault' }, 500);

    const vapidKeys = await webpush.importVapidKeys(JSON.parse(vapidJson), {
      extractable: false,
    });
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: 'mailto:mbdodt@gmail.com',
      vapidKeys,
    });

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body ?? '',
      link: notification.link ?? '/',
    });

    let sent = 0;
    await Promise.all(
      subs.map(async (sub) => {
        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          });
          // ttl 0 (the library default) means "deliver instantly or drop" —
          // pushes to idle/closed devices were silently discarded by APNs
          await subscriber.pushTextMessage(payload, {
            ttl: 24 * 60 * 60,
            urgency: webpush.Urgency.High,
          });
          sent++;
        } catch (err) {
          // Expired/revoked subscriptions are pruned so we stop retrying them
          if (err instanceof webpush.PushMessageError && err.isGone()) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error('Push fejlede for', sub.endpoint, err);
          }
        }
      })
    );

    return json({ sent });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
