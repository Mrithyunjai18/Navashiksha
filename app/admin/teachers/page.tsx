'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeachersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'TEACHER', branch: '', assignedClass: '', assignedSection: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/teacher/assessment');
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

  function openReset(t: any) {
    setResetTarget(t.id); setResetEmail(t.email); setResetPassword(''); setResetMessage('');
  }

  async function submitReset() {
    setResetSaving(true); setResetMessage('');
    const res = await fetch(`/api/admin/teachers/${resetTarget}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail: resetEmail, newPassword: resetPassword || undefined }),
    });
    const data = await res.json();
    setResetSaving(false);
    if (!res.ok) { setResetMessage(`❌ ${data.error}`); return; }
    setResetMessage('✅ Updated.');
    loadTeachers();
    setTimeout(() => setResetTarget(null), 900);
  }

  async function toggleActive(t: any) {
    await fetch(`/api/admin/teachers/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: t.isActive === 'false' }),
    });
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

          <div className="col-span-2 flex items-center gap-3 mt-2">
            <button disabled={saving} className="px-4 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{saving ? 'Saving…' : 'Add User'}</button>
            {message && <span className="text-sm">{message}</span>}
          </div>
          <p className="col-span-2 text-xs text-gray-400">Note: for Teachers, Branch/Class/Section must exactly match how you entered them on the Students page — that's what controls which students they see.</p>
        </form>

        <div className="bg-white rounded-xl2 shadow-sm p-5">
          <h2 className="font-bold text-lg text-ns-purple mb-3">All Users ({teachers.length})</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-1">Name</th><th>Email</th><th>Role</th><th>Class</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-1">{t.name}</td><td>{t.email}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${t.role === 'ADMIN' ? 'bg-ns-purple/20 text-ns-purple' : 'bg-ns-blue/20 text-ns-blue'}`}>{t.role}</span></td>
                  <td>{t.assignedClass ? `${t.assignedClass}-${t.assignedSection}` : '—'}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${t.isActive !== 'false' ? 'bg-ns-green/20 text-ns-green' : 'bg-gray-200'}`}>{t.isActive !== 'false' ? 'Active' : 'Inactive'}</span></td>
                  <td className="space-x-2">
                    <button onClick={() => openReset(t)} className="text-ns-blue">Reset</button>
                    <button onClick={() => toggleActive(t)} className="text-gray-500">{t.isActive !== 'false' ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-ns-purple mb-3">Reset Login</h3>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input className="w-full border rounded-lg p-2 text-sm mb-3" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password (leave blank to keep current)</label>
            <input className="w-full border rounded-lg p-2 text-sm mb-3" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="min. 6 characters" />
            {resetMessage && <p className="text-sm mb-2">{resetMessage}</p>}
            <div className="flex gap-2">
              <button onClick={() => setResetTarget(null)} className="flex-1 py-2 rounded-xl2 border">Cancel</button>
              <button onClick={submitReset} disabled={resetSaving} className="flex-1 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{resetSaving ? 'Saving…' : 'Save'}</button>
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
