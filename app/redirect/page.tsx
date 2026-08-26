import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { isAdminRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function RedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = (session.user as any).role;
  redirect(isAdminRole(role) ? '/admin' : '/teacher/assessment');
}
