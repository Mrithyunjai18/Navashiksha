'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function BackButton() {
  const router = useRouter();
  const { data: session } = useSession();

  // Only staff (any logged-in role) should see internal navigation —
  // a parent opening the shared report link has no session at all.
  if (!session?.user) return null;

  return (
    <button
      onClick={() => { if (window.history.length > 1) router.back(); else router.push('/admin'); }}
      className="text-ns-purple font-semibold text-sm flex items-center gap-1"
    >
      ← Back
    </button>
  );
}
