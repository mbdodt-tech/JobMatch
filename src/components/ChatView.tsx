'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Send, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Counterpart {
  name: string;
  imageUrl: string | null;
  isStore: boolean;
}

interface ChatViewProps {
  matchId: string;
  backHref: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'I dag';
  if (d.toDateString() === yesterday.toDateString()) return 'I går';
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' });
}

export default function ChatView({ matchId, backHref }: ChatViewProps) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [counterpart, setCounterpart] = useState<Counterpart | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }, []);

  const markIncomingRead = useCallback(
    (uid: string) => {
      supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', uid)
        .is('read_at', null)
        .then(() => {});
    },
    [matchId, supabase]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      if (cancelled) return;
      setUserId(user.id);

      const { data: match } = await supabase
        .from('matches')
        .select(
          'id, student_id, store:stores(id, name, logo_url, manager_id), student:profiles!matches_student_id_fkey(id, full_name, avatar_url)'
        )
        .eq('id', matchId)
        .maybeSingle();

      if (cancelled) return;
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      type MatchJoin = {
        student_id: string;
        store: { name: string; logo_url: string | null; manager_id: string } | null;
        student: { full_name: string | null; avatar_url: string | null } | null;
      };
      const m = match as unknown as MatchJoin;
      const iAmStudent = m.student_id === user.id;
      setCounterpart(
        iAmStudent
          ? { name: m.store?.name ?? 'Butik', imageUrl: m.store?.logo_url ?? null, isStore: true }
          : { name: m.student?.full_name ?? 'Elev', imageUrl: m.student?.avatar_url ?? null, isStore: false }
      );

      const { data: rows } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (cancelled) return;
      setMessages((rows as MessageRow[]) ?? []);
      setLoading(false);
      markIncomingRead(user.id);
      scrollToBottom();
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [matchId, supabase, markIncomingRead, scrollToBottom]);

  // Live delivery — dedupe against optimistic inserts by id
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as MessageRow;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.sender_id !== userId) markIncomingRead(userId);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, userId, supabase, markIncomingRead, scrollToBottom]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending || !userId) return;
    setSending(true);
    setSendError('');
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ match_id: matchId, sender_id: userId, content })
        .select()
        .single();
      if (error) {
        setSendError('Beskeden kunne ikke sendes. Prøv igen.');
        return;
      }
      setDraft('');
      const msg = data as MessageRow;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      scrollToBottom();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-dvh aurora-bg aurora-bg-subtle flex items-center justify-center"
        role="status"
        aria-label="Indlæser chat"
      >
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-dvh aurora-bg aurora-bg-subtle flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400" aria-hidden="true" />
        <p className="text-white font-semibold">Chatten findes ikke</p>
        <p className="text-sm text-[#94A3B8]">Den findes kun for aktive matches, du selv er en del af.</p>
        <Link href={backHref} className="mt-2 px-6 py-3 rounded-xl btn-gradient text-white font-semibold text-sm">
          Tilbage
        </Link>
      </div>
    );
  }

  return (
    <div className="h-dvh aurora-bg aurora-bg-subtle flex flex-col">
      {/* Header */}
      <div className="shrink-0 safe-top backdrop-blur-xl bg-[#05050A]/80 border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center gap-3 px-3 py-3">
          <Link
            href={backHref}
            aria-label="Tilbage til matches"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </Link>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
            {counterpart?.imageUrl ? (
              <img
                src={counterpart.imageUrl}
                alt=""
                className={`w-full h-full ${counterpart.isStore ? 'object-contain bg-white/10 p-1' : 'object-cover'}`}
              />
            ) : counterpart?.isStore ? (
              <StoreIcon className="w-5 h-5 text-white/80" aria-hidden="true" />
            ) : (
              <span className="text-base font-bold text-white">
                {counterpart?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold truncate">{counterpart?.name}</h1>
            <p className="text-[11px] text-[#94A3B8]">I har matchet — sig hej! 👋</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-16 px-6">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm text-[#94A3B8]">
                Ingen beskeder endnu. Skriv den første — fx hvornår I kan mødes til en snak.
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const mine = msg.sender_id === userId;
            const prev = messages[i - 1];
            const newDay =
              !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString();
            return (
              <div key={msg.id}>
                {newDay && (
                  <p className="text-center text-[10px] font-medium uppercase tracking-wider text-[#94A3B8] py-2">
                    {formatDay(msg.created_at)}
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      mine
                        ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-br-md'
                        : 'glass text-[#F8FAFC] rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-[#94A3B8]'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 backdrop-blur-xl bg-[#05050A]/80 border-t border-white/10 safe-bottom">
        {sendError && (
          <p className="max-w-md mx-auto px-4 pt-2 text-xs text-rose-300 flex items-center gap-1.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {sendError}
          </p>
        )}
        <div className="max-w-md mx-auto flex items-end gap-2 px-4 py-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Skriv en besked…"
            aria-label="Skriv en besked"
            className="flex-1 !py-3.5 !rounded-2xl text-base"
          />
          <button
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            aria-label="Send besked"
            className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-5 h-5 text-white" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
