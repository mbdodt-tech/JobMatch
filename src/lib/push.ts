import type { SupabaseClient } from '@supabase/supabase-js';

// VAPID public key — safe to ship to the browser (the private half lives in
// Supabase Vault and is only used by the send-push edge function).
const VAPID_PUBLIC_KEY =
  'BL4ETOka4LfR8UmFnTlpmbCg3kIRiGbmeyPwTn8Lri6jhhvYOQDvW_LzF4smoy5odFjZGMsD1Vlqy3JXfg6vWxE';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export type EnablePushResult = 'ok' | 'denied' | 'unsupported' | 'error';

/** Whether THIS device/browser currently holds an active push subscription. */
export async function isDeviceSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Registers the service worker, asks for notification permission (must be
 * called from a user gesture — iOS requirement) and stores the subscription.
 */
export async function enablePush(supabase: SupabaseClient): Promise<EnablePushResult> {
  if (!isPushSupported()) return 'unsupported';
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      }));

    const json = subscription.toJSON();
    if (!json.keys?.p256dh || !json.keys?.auth) return 'error';

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'error';

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    );
    return error ? 'error' : 'ok';
  } catch (err) {
    console.error('Kunne ikke aktivere push:', err);
    return 'error';
  }
}

/** Removes this device's subscription (other devices keep theirs). */
export async function disablePush(supabase: SupabaseClient): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error('Kunne ikke deaktivere push:', err);
  }
}
