'use client';
import { useEffect, useState } from 'react';

export default function AcknowledgeWidget({ assessmentId }: { assessmentId: string }) {
  const [checking, setChecking] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`/api/report/${assessmentId}/acknowledge`)
      .then((r) => r.json())
      .then((d) => setAcknowledged(!!d.acknowledged))
      .finally(() => setChecking(false));
  }, [assessmentId]);

  async function sendAck(withReply?: string) {
    setSending(true);
    await fetch(`/api/report/${assessmentId}/acknowledge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: withReply || '' }),
    });
    setSending(false); setSent(true); setAcknowledged(true); setShowReplyBox(false);
  }

  if (checking) return null;

  if (sent || acknowledged) {
    return (
      <div className="max-w-xl mx-auto mt-3 text-center print:hidden">
        <p className="text-sm text-ns-purple font-medium">💛 Thanks for reading — we've noted you've seen this report.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-3 print:hidden">
      {!showReplyBox ? (
        <div className="flex gap-2">
          <button
            onClick={() => sendAck()} disabled={sending}
            className="flex-1 py-2 rounded-xl2 bg-pink-500 text-white font-semibold disabled:opacity-50"
          >
            {sending ? 'Sending…' : '❤️ Seen'}
          </button>
          <button onClick={() => setShowReplyBox(true)} className="flex-1 py-2 rounded-xl2 border border-pink-400 text-pink-600 font-semibold">
            💬 Leave a quick note
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-sm p-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">A short note for the teacher (optional)</label>
          <textarea
            className="w-full border rounded-lg p-2 text-sm" rows={2} maxLength={280}
            value={reply} onChange={(e) => setReply(e.target.value)}
            placeholder="e.g. Thank you, we've been practicing at home too!"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowReplyBox(false)} className="flex-1 py-2 rounded-xl2 border text-sm">Cancel</button>
            <button onClick={() => sendAck(reply)} disabled={sending} className="flex-1 py-2 rounded-xl2 bg-pink-500 text-white font-semibold text-sm disabled:opacity-50">
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
