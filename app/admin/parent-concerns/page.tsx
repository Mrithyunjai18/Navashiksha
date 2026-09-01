'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminRole } from '@/lib/roles';

const CLASSES = ['Playgroup', 'Nursery', 'LKG', 'UKG'];

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

  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState<any>({ title: '', ageWise: { Playgroup: '', Nursery: '', LKG: '', UKG: '' }, schoolStrategies: '', homeTips: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && !isAdminRole((session?.user as any)?.role)) router.push('/teacher/assessment');
  }, [status, session]);

  async function load() {
    const res = await fetch('/api/admin/parent-concerns');
    if (res.ok) setConcerns(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openEdit(c: any) {
    setExpanded(c.code);
    let ageWise: Record<string, string[]> = {};
    try { ageWise = JSON.parse(c.ageWiseExpectations || '{}'); } catch {}
    const ageWiseText: Record<string, string> = {};
    for (const cls of CLASSES) ageWiseText[cls] = (ageWise[cls] || []).join(', ');
    setEditForm({ title: c.title, ageWise: ageWiseText, schoolStrategies: toCommaList(c.schoolStrategies), homeTips: toCommaList(c.homeTips) });
    setMessage('');
  }

  async function submitEdit(code: string) {
    setSaving(true); setMessage('');
    const ageWiseJson: Record<string, string[]> = {};
    for (const cls of CLASSES) ageWiseJson[cls] = editForm.ageWise[cls].split(',').map((s: string) => s.trim()).filter(Boolean);
    const res = await fetch(`/api/admin/parent-concerns/${code}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editForm.title, ageWiseExpectations: JSON.stringify(ageWiseJson), schoolStrategies: toPipeList(editForm.schoolStrategies), homeTips: toPipeList(editForm.homeTips) }),
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
    setDeleteTarget(null); setExpanded(null);
    load();
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true); setAddMessage('');
    const ageWiseJson: Record<string, string[]> = {};
    for (const cls of CLASSES) ageWiseJson[cls] = newForm.ageWise[cls].split(',').map((s: string) => s.trim()).filter(Boolean);
    const res = await fetch('/api/admin/parent-concerns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newForm.title, ageWiseExpectations: JSON.stringify(ageWiseJson), schoolStrategies: toPipeList(newForm.schoolStrategies), homeTips: toPipeList(newForm.homeTips) }),
    });
    const data = await res.json();
    setAddSaving(false);
    if (!res.ok) { setAddMessage(`❌ ${data.error}`); return; }
    setAddMessage('✅ Added.');
    setNewForm({ title: '', ageWise: { Playgroup: '', Nursery: '', LKG: '', UKG: '' }, schoolStrategies: '', homeTips: '' });
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
        <p className="text-sm text-gray-500 mb-4">These are the concern cards teachers pick from on the weekly form. Age-wise expectations are shown per class (Playgroup/Nursery/LKG/UKG) automatically matched to the selected student. This is internal-only — never shown on the parent report.</p>

        <button onClick={() => setShowAdd(!showAdd)} className="mb-4 px-4 py-2 rounded-xl2 bg-ns-purple text-white text-sm font-semibold">
          {showAdd ? 'Cancel' : '+ Add New Concern'}
        </button>

        {showAdd && (
          <form onSubmit={submitAdd} className="bg-white rounded-xl2 shadow-sm p-5 mb-6 space-y-3">
            <Field label="Title *" value={newForm.title} onChange={(v: string) => setNewForm({ ...newForm, title: v })} placeholder="e.g. Toilet Training Difficulty" />
            {CLASSES.map((cls) => (
              <Field key={cls} label={`${cls} — what's typical (comma-separated)`} value={newForm.ageWise[cls]} onChange={(v: string) => setNewForm({ ...newForm, ageWise: { ...newForm.ageWise, [cls]: v } })} />
            ))}
            <Field label="Strategies used at school (comma-separated)" value={newForm.schoolStrategies} onChange={(v: string) => setNewForm({ ...newForm, schoolStrategies: v })} />
            <Field label="Home tips (comma-separated)" value={newForm.homeTips} onChange={(v: string) => setNewForm({ ...newForm, homeTips: v })} />
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
                  <Field label="Title" value={editForm.title} onChange={(v: string) => setEditForm({ ...editForm, title: v })} />
                  {CLASSES.map((cls) => (
                    <Field key={cls} label={`${cls} — what's typical (comma-separated)`} value={editForm.ageWise[cls]} onChange={(v: string) => setEditForm({ ...editForm, ageWise: { ...editForm.ageWise, [cls]: v } })} />
                  ))}
                  <Field label="Strategies used at school (comma-separated)" value={editForm.schoolStrategies} onChange={(v: string) => setEditForm({ ...editForm, schoolStrategies: v })} />
                  <Field label="Home tips (comma-separated)" value={editForm.homeTips} onChange={(v: string) => setEditForm({ ...editForm, homeTips: v })} />
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
