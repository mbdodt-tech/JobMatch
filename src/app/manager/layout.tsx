import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ManagerShell from './ManagerShell';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['store_manager', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }

  return <ManagerShell>{children}</ManagerShell>;
}
