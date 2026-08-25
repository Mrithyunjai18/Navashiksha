'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function toCommaList(pipeStr: string): string { return (pipeStr || '').split('|').filter(Boolean).join(', '); }
function toPipeList(commaStr: string): string { return commaStr.split(',').map((s) => s.trim()).filter(Boolean).join('|'); }

export default function ParentConcernsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [concerns, setConcerns] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // add-new form
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', signs: '', normalByAge: '', schoolSupports: '', homeTips: '', linkedFocusAreas: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/teacher/assessment');
  }, [status, session]);

  async function load() {
    const res = await fetch('/api/admin/parent-concerns');
    if (res.ok) setConcerns(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openEdit(c: any) {
    setExpanded(c.code);
    setEditForm({
      title: c.title,
      signs: toCommaList(c.signs), normalByAge: toCommaList(c.normalByAge),
      schoolSupports: toCommaList(c.schoolSupports), homeTips: toCommaList(c.homeTips),
      linkedFocusAreas: toCommaList(c.linkedFocusAreas),
    });
    setMessage('');
  }

  async function submitEdit(code: string) {
    setSaving(true); setMessage('');
    const res = await fetch(`/api/admin/parent-concerns/${code}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        signs: toPipeList(editForm.signs), normalByAge: toPipeList(editForm.normalByAge),
        schoolSupports: toPipeList(editForm.schoolSupports), homeTips: toPipeList(editForm.homeTips),
        linkedFocusAreas: toPipeList(editForm.linkedFocusAreas),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
    setMessage('✅ Saved.');
    load();
  }

  async function confirmDelete() {
    setDeleting(true);
    await fetch(`/api/admin/parent-concerns/${deleteTarget.code}`, { method: 'DELETE' });
    setDeleting(false);
    setDeleteTarget(null);
    setExpanded(null);
    load();
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true); setAddMessage('');
    const res = await fetch('/api/admin/parent-concerns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newForm.title,
        signs: toPipeList(newForm.signs), normalByAge: toPipeList(newForm.normalByAge),
        schoolSupports: toPipeList(newForm.schoolSupports), homeTips: toPipeList(newForm.homeTips),
        linkedFocusAreas: toPipeList(newForm.linkedFocusAreas),
      }),
    });
    const data = await res.json();
    setAddSaving(false);
    if (!res.ok) { setAddMessage(`❌ ${data.error}`); return; }
    setAddMessage('✅ Added.');
    setNewForm({ title: '', signs: '', normalByAge: '', schoolSupports: '', homeTips: '', linkedFocusAreas: '' });
    load();
    setTimeout(() => setShowAdd(false), 700);
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Parent Concerns</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Dashboard</Link>
        </div>
        <p className="text-sm text-gray-500 mb-4">These are the concern cards teachers pick from on the weekly assessment form. Edit the signs, school supports, and home tips shown for each — separate items with commas.</p>

        <button onClick={() => setShowAdd(!showAdd)} className="mb-4 px-4 py-2 rounded-xl2 bg-ns-purple text-white text-sm font-semibold">
          {showAdd ? 'Cancel' : '+ Add New Concern'}
        </button>

        {showAdd && (
          <form onSubmit={submitAdd} className="bg-white rounded-xl2 shadow-sm p-5 mb-6 space-y-3">
            <Field label="Title *" value={newForm.title} onChange={(v) => setNewForm({ ...newForm, title: v })} placeholder="e.g. Toilet Training Difficulty" />
            <Field label="Signs (comma-separated)" value={newForm.signs} onChange={(v) => setNewForm({ ...newForm, signs: v })} />
            <Field label="Normal by Age (comma-separated, e.g. '2 yrs: description')" value={newForm.normalByAge} onChange={(v) => setNewForm({ ...newForm, normalByAge: v })} />
            <Field label="School Support (comma-separated)" value={newForm.schoolSupports} onChange={(v) => setNewForm({ ...newForm, schoolSupports: v })} />
            <Field label="Home Tips (comma-separated)" value={newForm.homeTips} onChange={(v) => setNewForm({ ...newForm, homeTips: v })} />
            <Field label="Linked Focus Areas (comma-separated, optional)" value={newForm.linkedFocusAreas} onChange={(v) => setNewForm({ ...newForm, linkedFocusAreas: v })} />
            <div className="flex items-center gap-3">
              <button disabled={addSaving} className="px-4 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{addSaving ? 'Saving…' : 'Add Concern'}</button>
              {addMessage && <span className="text-sm">{addMessage}</span>}
            </div>
          </form>
        )}

        <div className="space-y-3">
          {concerns.map((c) => (
            <div key={c.code} className="bg-white rounded-xl2 shadow-sm p-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-ns-purple">{c.title}</p>
                <div className="space-x-3 text-xs">
                  <button onClick={() => (expanded === c.code ? setExpanded(null) : openEdit(c))} className="text-ns-blue">{expanded === c.code ? 'Close' : 'Edit'}</button>
                  <button onClick={() => setDeleteTarget(c)} className="text-red-500">Delete</button>
                </div>
              </div>

              {expanded === c.code && (
                <div className="mt-3 space-y-3 border-t pt-3">
                  <Field label="Title" value={editForm.title} onChange={(v) => setEditForm({ ...editForm, title: v })} />
                  <Field label="Signs (comma-separated)" value={editForm.signs} onChange={(v) => setEditForm({ ...editForm, signs: v })} />
                  <Field label="Normal by Age (comma-separated)" value={editForm.normalByAge} onChange={(v) => setEditForm({ ...editForm, normalByAge: v })} />
                  <Field label="School Support (comma-separated)" value={editForm.schoolSupports} onChange={(v) => setEditForm({ ...editForm, schoolSupports: v })} />
                  <Field label="Home Tips (comma-separated)" value={editForm.homeTips} onChange={(v) => setEditForm({ ...editForm, homeTips: v })} />
                  <Field label="Linked Focus Areas (comma-separated)" value={editForm.linkedFocusAreas} onChange={(v) => setEditForm({ ...editForm, linkedFocusAreas: v })} />
                  <div className="flex items-center gap-3">
                    <button onClick={() => submitEdit(c.code)} disabled={saving} className="px-4 py-2 rounded-xl2 bg-ns-purple text-white font-semibold text-sm">{saving ? 'Saving…' : 'Save Changes'}</button>
                    {message && <span className="text-sm">{message}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {concerns.length === 0 && <p className="text-sm text-gray-400">No parent concern cards yet.</p>}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-red-600 mb-2">Delete "{deleteTarget.title}"?</h3>
            <p className="text-sm text-gray-600 mb-4">This removes it from the teacher form. Past assessments that referenced it keep their historical data.</p>
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

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input className="w-full border rounded-lg p-2 text-sm" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
