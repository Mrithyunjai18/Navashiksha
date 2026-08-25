'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABEL: Record<string, string> = { text: 'Short Text', textarea: 'Paragraph', single_select: 'Single Choice', multi_select: 'Multiple Choice' };

export default function CustomQuestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/teacher/assessment');
  }, [status, session]);

  async function load() {
    const res = await fetch('/api/admin/questions');
    if (res.ok) setQuestions(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    const res = await fetch('/api/admin/questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, type, options }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
    setMessage('✅ Question added — it will now appear on the teacher assessment form.');
    setLabel(''); setOptions(''); setType('text');
    load();
  }

  async function toggleActive(q: any) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: q.isActive === 'false' }),
    });
    load();
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Custom Questions</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Dashboard</Link>
        </div>
        <p className="text-sm text-gray-500 mb-4">Add extra questions to the weekly assessment form — they'll appear for every teacher, for every student, right after the standard sections.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-sm p-5 mb-6 space-y-3">
          <h2 className="font-bold text-lg text-ns-purple">Add a Question</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question Text *</label>
            <input className="w-full border rounded-lg p-2 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Did the child bring their own lunch this week?" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Answer Type *</label>
            <select className="w-full border rounded-lg p-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="text">Short Text</option>
              <option value="textarea">Paragraph</option>
              <option value="single_select">Single Choice (pick one)</option>
              <option value="multi_select">Multiple Choice (pick any)</option>
            </select>
          </div>
          {(type === 'single_select' || type === 'multi_select') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Options (comma-separated) *</label>
              <input className="w-full border rounded-lg p-2 text-sm" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="e.g. Yes, No, Sometimes" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <button disabled={saving} className="px-4 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{saving ? 'Saving…' : 'Add Question'}</button>
            {message && <span className="text-sm">{message}</span>}
          </div>
        </form>

        <div className="bg-white rounded-xl2 shadow-sm p-5">
          <h2 className="font-bold text-lg text-ns-purple mb-3">All Questions ({questions.filter((q) => q.isActive !== 'false').length} active)</h2>
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className={`flex justify-between items-center border rounded-lg p-3 ${q.isActive === 'false' ? 'opacity-50' : ''}`}>
                <div>
                  <p className="text-sm font-medium">{q.label}</p>
                  <p className="text-xs text-gray-400">{TYPE_LABEL[q.type]}{q.options ? ` — ${q.options}` : ''}</p>
                </div>
                <button onClick={() => toggleActive(q)} className="text-xs text-ns-blue">{q.isActive === 'false' ? 'Reactivate' : 'Deactivate'}</button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-sm text-gray-400">No custom questions yet.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
