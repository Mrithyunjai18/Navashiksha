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
  const [points, setPoints] = useState('');
  const [parentQuestionId, setParentQuestionId] = useState('');
  const [triggerOption, setTriggerOption] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/teacher/assessment');
  }, [status, session]);

  async function load() {
    const res = await fetch('/api/admin/questions');
    if (res.ok) setQuestions(await res.json());
  }
  useEffect(() => { load(); }, []);

  // top-level questions that can act as a parent (must be a choice type to branch off of)
  const branchableParents = questions.filter((q) => (q.type === 'single_select' || q.type === 'multi_select') && !q.parentQuestionId);
  const selectedParent = branchableParents.find((q) => q.id === parentQuestionId);
  const parentOptions = selectedParent ? (selectedParent.options || '').split(',').map((o: string) => o.trim()).filter(Boolean) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    const res = await fetch('/api/admin/questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, type, options, points: points || undefined, parentQuestionId: parentQuestionId || undefined, triggerOption: triggerOption || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
    setMessage(parentQuestionId ? '✅ Sub-question added — it will appear when that answer is picked.' : '✅ Question added.');
    setLabel(''); setOptions(''); setType('text'); setPoints(''); setParentQuestionId(''); setTriggerOption('');
    load();
  }

  async function toggleActive(q: any) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: q.isActive === 'false' }),
    });
    load();
  }

  function openEdit(q: any) {
    setEditTarget(q.id);
    setEditForm({ label: q.label, type: q.type, options: q.options || '', points: q.points || '' });
    setEditMessage('');
  }

  async function submitEdit() {
    if ((editForm.type === 'single_select' || editForm.type === 'multi_select') && !editForm.options.trim()) {
      setEditMessage('❌ Options are required for choice-type questions.');
      return;
    }
    setEditSaving(true); setEditMessage('');
    const res = await fetch(`/api/admin/questions/${editTarget}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editForm.label, type: editForm.type, options: editForm.options, points: editForm.points }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) { setEditMessage(`❌ ${data.error}`); return; }
    setEditMessage('✅ Saved.');
    load();
    setTimeout(() => setEditTarget(null), 700);
  }

  async function confirmDelete() {
    setDeleting(true);
    await fetch(`/api/admin/questions/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }

  const topLevel = questions.filter((q) => !q.parentQuestionId);
  const childrenOf = (id: string) => questions.filter((q) => q.parentQuestionId === id);

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Custom Questions</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Dashboard</Link>
        </div>
        <p className="text-sm text-gray-500 mb-4">Add extra questions to the weekly assessment form. You can also add <strong>sub-questions</strong> that only appear when a specific answer is picked on a Single/Multiple Choice question — like branching in Google Forms.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-sm p-5 mb-6 space-y-3">
          <h2 className="font-bold text-lg text-ns-purple">Add a Question</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Show this question only after a specific answer? (optional)</label>
            <select className="w-full border rounded-lg p-2 text-sm" value={parentQuestionId} onChange={(e) => { setParentQuestionId(e.target.value); setTriggerOption(''); }}>
              <option value="">No — show always (top-level question)</option>
              {branchableParents.map((q) => <option key={q.id} value={q.id}>Sub-question of: "{q.label}"</option>)}
            </select>
          </div>

          {parentQuestionId && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trigger when the answer is *</label>
              <select className="w-full border rounded-lg p-2 text-sm" value={triggerOption} onChange={(e) => setTriggerOption(e.target.value)}>
                <option value="">Select the triggering option…</option>
                {parentOptions.map((o: string) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question Text *</label>
            <input className="w-full border rounded-lg p-2 text-sm" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Did the child bring their own lunch this week?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Answer Type *</label>
              <select className="w-full border rounded-lg p-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="text">Short Text</option>
                <option value="textarea">Paragraph</option>
                <option value="single_select">Single Choice (pick one)</option>
                <option value="multi_select">Multiple Choice (pick any)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Points (optional)</label>
              <input type="number" className="w-full border rounded-lg p-2 text-sm" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="e.g. 5" />
            </div>
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
            {topLevel.map((q) => (
              <div key={q.id}>
                <QuestionRow q={q} onEdit={openEdit} onToggle={toggleActive} onDelete={setDeleteTarget} />
                {childrenOf(q.id).map((child) => (
                  <div key={child.id} className="ml-6 mt-1 border-l-2 border-ns-purple/20 pl-3">
                    <p className="text-xs text-gray-400 mb-1">↳ shown when "{q.label}" = <strong>{child.triggerOption}</strong></p>
                    <QuestionRow q={child} onEdit={openEdit} onToggle={toggleActive} onDelete={setDeleteTarget} />
                  </div>
                ))}
              </div>
            ))}
            {questions.length === 0 && <p className="text-sm text-gray-400">No custom questions yet.</p>}
          </div>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-ns-purple mb-3">Edit Question</h3>

            <label className="block text-xs font-medium text-gray-600 mb-1">Question Text</label>
            <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />

            <label className="block text-xs font-medium text-gray-600 mb-1">Answer Type</label>
            <select className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
              <option value="text">Short Text</option>
              <option value="textarea">Paragraph</option>
              <option value="single_select">Single Choice (pick one)</option>
              <option value="multi_select">Multiple Choice (pick any)</option>
            </select>

            {(editForm.type === 'single_select' || editForm.type === 'multi_select') && (
              <>
                <label className="block text-xs font-medium text-gray-600 mb-1">Options (comma-separated)</label>
                <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.options} onChange={(e) => setEditForm({ ...editForm, options: e.target.value })} />
              </>
            )}

            <label className="block text-xs font-medium text-gray-600 mb-1">Points (optional)</label>
            <input type="number" className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: e.target.value })} />

            {editMessage && <p className="text-sm mb-2">{editMessage}</p>}
            <div className="flex gap-2">
              <button onClick={() => setEditTarget(null)} className="flex-1 py-2 rounded-xl2 border">Cancel</button>
              <button onClick={submitEdit} disabled={editSaving} className="flex-1 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{editSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-red-600 mb-2">Delete this question?</h3>
            <p className="text-sm text-gray-600 mb-4">"{deleteTarget.label}" will be permanently removed. Any of its sub-questions will remain but stop showing since their trigger will be gone — deactivate or delete those too if needed.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl2 border">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-2 rounded-xl2 bg-red-600 text-white font-semibold">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function QuestionRow({ q, onEdit, onToggle, onDelete }: { q: any; onEdit: (q: any) => void; onToggle: (q: any) => void; onDelete: (q: any) => void }) {
  return (
    <div className={`flex justify-between items-center border rounded-lg p-3 ${q.isActive === 'false' ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium">{q.label}{q.points && <span className="ml-2 text-xs bg-ns-yellow/60 text-ns-purple rounded-full px-2 py-0.5">{q.points} pts</span>}</p>
        <p className="text-xs text-gray-400">{TYPE_LABEL[q.type]}{q.options ? ` — ${q.options}` : ''}</p>
      </div>
      <div className="space-x-3 text-xs whitespace-nowrap">
        <button onClick={() => onEdit(q)} className="text-ns-blue">Edit</button>
        <button onClick={() => onToggle(q)} className="text-gray-500">{q.isActive === 'false' ? 'Reactivate' : 'Deactivate'}</button>
        <button onClick={() => onDelete(q)} className="text-red-500">Delete</button>
      </div>
    </div>
  );
}
