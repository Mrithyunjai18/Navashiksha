'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AssessmentForm from './AssessmentForm';

export default function TeacherAssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [master, setMaster] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetch('/api/form-master').then((r) => r.json()).then(setMaster);
  }, [status]);

  if (!master) return <main className="p-6 text-center text-gray-400">Loading…</main>;

  return (
    <main className="bg-ns-cream min-h-screen p-4">
      <div className="max-w-2xl mx-auto mb-4">
        <h1 className="text-2xl font-extrabold text-ns-purple">Weekly Assessment</h1>
        <p className="text-sm text-gray-500">Signed in as {session?.user?.name} · <a href="/account" className="text-ns-blue underline">My Account</a></p>
      </div>
      <AssessmentForm master={master} />
    </main>
  );
}
