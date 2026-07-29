'use client';

import { useParams } from 'next/navigation';
import ChatView from '@/components/ChatView';

export default function ManagerChatPage() {
  const params = useParams<{ matchId: string }>();
  return <ChatView matchId={params.matchId} backHref="/manager/matches" />;
}
