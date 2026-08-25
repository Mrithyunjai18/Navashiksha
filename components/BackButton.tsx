'use client';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => { if (window.history.length > 1) router.back(); else router.push('/admin'); }}
      className="text-ns-purple font-semibold text-sm flex items-center gap-1"
    >
      ← Back
    </button>
  );
}
