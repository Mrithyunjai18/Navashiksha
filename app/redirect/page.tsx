import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';

export default async function RedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = (session.user as any).role;
  redirect(role === 'ADMIN' ? '/admin' : '/teacher/assessment');
}
