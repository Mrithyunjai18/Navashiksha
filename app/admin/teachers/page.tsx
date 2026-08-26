'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminRole } from '@/lib/roles';

export default function TeachersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'TEACHER', branch: '', assignedClass: '', assignedSection: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listError, setListError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && !isAdminRole((session?.user as any)?.role)) router.push('/teacher/assessment');
  }, [status, session]);

  async function loadTeachers() {
    const res = await fetch('/api/admin/teachers');
    if (res.ok) setTeachers(await res.json());
  }
  useEffect(() => { loadTeachers(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    const res = await fetch('/api/admin/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
    setMessage(`✅ Added ${form.name} (${form.role}) — share the email + password with them to log in.`);
    setForm({ email: '', password: '', name: '', role: 'TEACHER', branch: form.branch, assignedClass: form.assignedClass, assignedSection: form.assignedSection });
    loadTeachers();
  }

  function openEdit(t: any) {
    setEditTarget(t.id);
    setEditForm({ name: t.name, email: t.email, role: t.role, branch: t.branch || '', assignedClass: t.assignedClass || '', assignedSection: t.assignedSection || '', newPassword: '' });
    setEditMessage('');
  }

  async function submitEdit() {
    setEditSaving(true); setEditMessage('');
    const res = await fetch(`/api/admin/teachers/${editTarget}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name, newEmail: editForm.email, role: editForm.role,
        branch: editForm.branch, assignedClass: editForm.assignedClass, assignedSection: editForm.assignedSection,
        newPassword: editForm.newPassword || undefined,
      }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) { setEditMessage(`❌ ${data.error}`); return; }
    setEditMessage('✅ Updated.');
    loadTeachers();
    setTimeout(() => setEditTarget(null), 900);
  }

  async function toggleActive(t: any) {
    setListError('');
    const res = await fetch(`/api/admin/teachers/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: t.isActive === 'false' }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setListError(`❌ ${d.error || 'Could not update status.'}`); return; }
    loadTeachers();
  }

  async function confirmDelete() {
    setDeleting(true); setListError('');
    const res = await fetch(`/api/admin/teachers/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setListError(`❌ ${d.error || 'Could not delete user.'}`); setDeleteTarget(null); return; }
    setDeleteTarget(null);
    loadTeachers();
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Teachers & Admins</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Back to Dashboard</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-sm p-5 mb-6 grid grid-cols-2 gap-3">
          <h2 className="col-span-2 font-bold text-lg text-ns-purple">Add Teacher / Admin</h2>

          <Field label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email (used to log in) *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Password *" type="text" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="min. 6 characters — share this with them" />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
            <select className="w-full border rounded-lg p-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="TEACHER">Teacher</option>
              <option value="CENTER_HEAD">Center Head</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {form.role === 'TEACHER' && (
            <>
              <Field label="Branch *" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} placeholder="e.g. Chennai — must match Students" />
              <Field label="Class *" value={form.assignedClass} onChange={(v) => setForm({ ...form, assignedClass: v })} placeholder="e.g. LKG" />
              <Field label="Section *" value={form.assignedSection} onChange={(v) => setForm({ ...form, assignedSection: v })} placeholder="e.g. A" />
            </>
          )}
          {form.role === 'CENTER_HEAD' && (
            <Field label="Branch *" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} placeholder="e.g. Chennai — the center they head" />
          )}

          <div className="col-span-2 flex items-center gap-3 mt-2">
            <button disabled={saving} className="px-4 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{saving ? 'Saving…' : 'Add User'}</button>
            {message && <span className="text-sm">{message}</span>}
          </div>
          <p className="col-span-2 text-xs text-gray-400">Note: for Teachers, Branch/Class/Section must exactly match how you entered them on the Students page — that's what controls which students they see.</p>
        </form>

        <div className="bg-white rounded-xl2 shadow-sm p-5">
          <h2 className="font-bold text-lg text-ns-purple mb-3">All Users ({teachers.length})</h2>
          {listError && <p className="text-sm text-red-600 mb-3">{listError}</p>}
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-1">Name</th><th>Email</th><th>Role</th><th>Class</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-1">{t.name}</td><td>{t.email}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${t.role === 'ADMIN' ? 'bg-ns-purple/20 text-ns-purple' : t.role === 'CENTER_HEAD' ? 'bg-ns-pink/20 text-ns-pink' : 'bg-ns-blue/20 text-ns-blue'}`}>{t.role === 'CENTER_HEAD' ? 'Center Head' : t.role}</span></td>
                  <td>{t.assignedClass ? `${t.assignedClass}-${t.assignedSection}` : '—'}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${t.isActive !== 'false' ? 'bg-ns-green/20 text-ns-green' : 'bg-gray-200'}`}>{t.isActive !== 'false' ? 'Active' : 'Inactive'}</span></td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button onClick={() => openEdit(t)} className="text-ns-blue">Edit</button>
                    <button onClick={() => toggleActive(t)} className="text-gray-500">{t.isActive !== 'false' ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => setDeleteTarget(t)} className="text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-ns-purple mb-3">Edit User</h3>

            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />

            <label className="block text-xs font-medium text-gray-600 mb-1">Email (username)</label>
            <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />

            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="TEACHER">Teacher</option>
              <option value="CENTER_HEAD">Center Head</option>
              <option value="ADMIN">Admin</option>
            </select>

            {editForm.role === 'TEACHER' && (
              <>
                <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} />
                <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
                <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.assignedClass} onChange={(e) => setEditForm({ ...editForm, assignedClass: e.target.value })} />
                <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.assignedSection} onChange={(e) => setEditForm({ ...editForm, assignedSection: e.target.value })} />
              </>
            )}
            {editForm.role === 'CENTER_HEAD' && (
              <>
                <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} />
              </>
            )}

            <label className="block text-xs font-medium text-gray-600 mb-1">New Password (leave blank to keep current)</label>
            <input className="w-full border rounded-lg p-2 text-sm mb-3" value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="min. 6 characters" />

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
            <h3 className="font-bold text-lg text-red-600 mb-2">Delete {deleteTarget.name}?</h3>
            <p className="text-sm text-gray-600 mb-4">This permanently removes their login — they will no longer be able to sign in. Any assessments they already submitted stay in your records unaffected. Consider Deactivate instead if you just want to temporarily block access.</p>
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

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} className="w-full border rounded-lg p-2 text-sm" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
