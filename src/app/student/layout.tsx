import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StudentShell from './StudentShell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['student', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }

  return <StudentShell>{children}</StudentShell>;
}
