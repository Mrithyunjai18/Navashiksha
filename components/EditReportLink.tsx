'use client';
import { useSession } from 'next-auth/react';

export default function EditReportLink({ assessmentId }: { assessmentId: string }) {
  const { data: session } = useSession();
  const isAdmin = session?.user && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'CENTER_HEAD');
  if (!isAdmin) return null;

  return <a href={`/admin/assessments/${assessmentId}/edit`} className="text-ns-purple font-semibold text-sm">Edit (Admin) →</a>;
}
