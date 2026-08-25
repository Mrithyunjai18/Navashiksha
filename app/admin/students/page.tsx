'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', branch: '', class: '', section: '', studentCode: '', parentName: '', parentEmail: '', parentPhone: '', dateOfBirth: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/teacher/assessment');
  }, [status, session]);

  async function loadStudents() {
    const res = await fetch('/api/admin/students');
    if (res.ok) setStudents(await res.json());
  }
  useEffect(() => { loadStudents(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    const res = await fetch('/api/admin/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
    setMessage(`✅ Added ${form.name} (${data.studentCode})`);
    setForm({ name: '', branch: form.branch, class: form.class, section: form.section, studentCode: '', parentName: '', parentEmail: '', parentPhone: '', dateOfBirth: '' });
    loadStudents();
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Students</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Back to Dashboard</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-sm p-5 mb-6 grid grid-cols-2 gap-3">
          <h2 className="col-span-2 font-bold text-lg text-ns-purple">Add Student</h2>
          <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Student Code (optional — auto-generated if blank)" value={form.studentCode} onChange={(v) => setForm({ ...form, studentCode: v })} />
          <Field label="Branch *" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} placeholder="e.g. Chennai" />
          <Field label="Class *" value={form.class} onChange={(v) => setForm({ ...form, class: v })} placeholder="e.g. LKG" />
          <Field label="Section *" value={form.section} onChange={(v) => setForm({ ...form, section: v })} placeholder="e.g. A" />
          <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
          <Field label="Parent Name" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />
          <Field label="Parent Phone" value={form.parentPhone} onChange={(v) => setForm({ ...form, parentPhone: v })} />
          <Field label="Parent Email" value={form.parentEmail} onChange={(v) => setForm({ ...form, parentEmail: v })} />
          <div className="col-span-2 flex items-center gap-3 mt-2">
            <button disabled={saving} className="px-4 py-2 rounded-xl2 bg-ns-purple text-white font-semibold">{saving ? 'Saving…' : 'Add Student'}</button>
            {message && <span className="text-sm">{message}</span>}
          </div>
          <p className="col-span-2 text-xs text-gray-400">Note: Class and Section must exactly match what you assign to teachers in the Teachers sheet tab, so they can see this student.</p>
        </form>

        <div className="bg-white rounded-xl2 shadow-sm p-5">
          <h2 className="font-bold text-lg text-ns-purple mb-3">All Students ({students.length})</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-1">Code</th><th>Name</th><th>Class</th><th>Branch</th><th>Status</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-1">{s.studentCode}</td><td>{s.name}</td><td>{s.class}-{s.section}</td><td>{s.branch}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'Active' ? 'bg-ns-green/20 text-ns-green' : 'bg-gray-200'}`}>{s.status || 'Active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
