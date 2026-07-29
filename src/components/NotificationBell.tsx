'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Heart, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/Modal';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

function timeAgo(iso: string): string {
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMins < 1) return 'Lige nu';
  if (diffMins < 60) return `${diffMins} min.`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} t.`;
  return `${Math.floor(diffHours / 24)} d.`;
}

/** Dock item: bell with unread badge + a notification sheet. */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!cancelled) {
        setItems((data as NotificationRow[]) ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as NotificationRow;
          setItems((prev) => (prev.some((i) => i.id === n.id) ? prev : [n, ...prev]));
          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted' &&
            document.hidden
          ) {
            new Notification(n.title, { body: n.body ?? undefined, icon: '/icons/icon-192.png' });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unread = items.filter((i) => !i.read_at).length;

  function openPanel() {
    setOpen(true);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => (i.read_at ? i : { ...i, read_at: now })));
    await supabase.from('notifications').update({ read_at: now }).is('read_at', null);
  }

  async function openNotification(n: NotificationRow) {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read_at: now } : i)));
      await supabase.from('notifications').update({ read_at: now }).eq('id', n.id);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <>
      <button
        onClick={openPanel}
        aria-label={unread > 0 ? `Notifikationer, ${unread} ulæste` : 'Notifikationer'}
        className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-full min-w-0"
      >
        <Bell size={20} className="text-[#94A3B8] hover:text-white transition-colors" aria-hidden="true" />
        <span className="text-[10px] font-medium text-[#94A3B8]">Aktivitet</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Notifikationer"
        variant="sheet"
        contentClassName="max-h-[75dvh] overflow-y-auto bg-[#0E0E18] rounded-t-3xl border-t border-white/10"
      >
        <div className="sticky top-0 z-10 bg-[#0E0E18] flex justify-center py-3 rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="px-5 pb-8 max-w-md mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Aktivitet</h2>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Markér alle som læst
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10" role="status" aria-label="Indlæser notifikationer">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" aria-hidden="true" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🔔</p>
              <p className="text-sm text-[#94A3B8]">
                Ingen aktivitet endnu — her lander dine matches og beskeder.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                    n.read_at ? 'hover:bg-white/[0.04]' : 'bg-violet-500/10 hover:bg-violet-500/15'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                      n.type === 'match'
                        ? 'bg-emerald-500/15 border-emerald-500/30'
                        : 'bg-violet-500/15 border-violet-500/25'
                    }`}
                  >
                    {n.type === 'match' ? (
                      <Heart className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-violet-300" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${n.read_at ? 'text-[#94A3B8]' : 'text-white font-semibold'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">{n.body}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#94A3B8] shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
