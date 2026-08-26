'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DeleteReportButton({ assessmentId }: { assessmentId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = session?.user && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'CENTER_HEAD');
  if (!isAdmin) return null;

  async function handleDelete() {
    setDeleting(true); setError('');
    const res = await fetch(`/api/admin/assessments/${assessmentId}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Could not delete.'); return; }
    window.location.href = '/admin'; // hard navigation — avoids Next.js client router cache showing the stale (pre-delete) dashboard
  }

  return (
    <>
      <button onClick={() => setConfirming(true)} className="text-red-500 font-semibold text-sm">Delete Report</button>

      {confirming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-red-600 mb-2">Delete this report?</h3>
            <p className="text-sm text-gray-600 mb-4">This removes the assessment from dashboards and reports. It won't appear for the parent anymore.</p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl2 border">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-xl2 bg-red-600 text-white font-semibold">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
