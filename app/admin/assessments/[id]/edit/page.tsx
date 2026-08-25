'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditAssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/teacher/assessment');
  }, [status, session]);

  useEffect(() => {
    fetch(`/api/admin/assessments/${id}`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setForm(data);
    });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    const res = await fetch(`/api/admin/assessments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStartDate: form.weekStartDate, assessmentDate: form.assessmentDate,
        workingDays: form.workingDays, daysPresent: form.daysPresent, status: form.status,
        language: form.language, maths: form.maths, concepts: form.concepts,
        letterRecognition: form.letterRecognition, numberRecognition: form.numberRecognition,
        shapeRecognition: form.shapeRecognition, colourRecognition: form.colourRecognition,
        mostEnjoyedActivity: form.mostEnjoyedActivity, weeklyStarMoment: form.weeklyStarMoment, teacherNote: form.teacherNote,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(`❌ ${data.error}`); return; }
    setMessage('✅ Saved successfully.');
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/admin/assessments/${id}`, { method: 'DELETE' });
    setDeleting(false);
    router.push('/admin');
  }

  if (!form) return <main className="p-6 text-center text-gray-400">Loading…</main>;

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Edit Assessment</h1>
          <div className="flex gap-3 text-sm">
            <Link href={`/report/${id}`} className="text-ns-blue">View Report</Link>
            <Link href="/admin" className="text-ns-blue">← Dashboard</Link>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl2 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Week Start Date" type="date" value={form.weekStartDate} onChange={(v) => setForm({ ...form, weekStartDate: v })} />
            <Field label="Assessment Date" type="date" value={form.assessmentDate} onChange={(v) => setForm({ ...form, assessmentDate: v })} />
            <Field label="Working Days" type="number" value={form.workingDays} onChange={(v) => setForm({ ...form, workingDays: v })} />
            <Field label="Days Present" type="number" value={form.daysPresent} onChange={(v) => setForm({ ...form, daysPresent: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className="w-full border rounded-lg p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 gap-3">
            <Field label="Language" value={form.language} onChange={(v) => setForm({ ...form, language: v })} />
            <Field label="Maths" value={form.maths} onChange={(v) => setForm({ ...form, maths: v })} />
            <Field label="Concepts" value={form.concepts} onChange={(v) => setForm({ ...form, concepts: v })} />
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-3">
            {(['letterRecognition', 'numberRecognition', 'shapeRecognition', 'colourRecognition'] as const).map((k) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{k.replace('Recognition', ' Recognition')}</label>
                <select className="w-full border rounded-lg p-2 text-sm" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                  <option value="">—</option>
                  <option value="NOT_YET_INTRODUCED">Not yet introduced</option>
                  <option value="WITH_HELP">With help</option>
                  <option value="INDEPENDENT">Independent</option>
                </select>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <TextAreaField label="Most Enjoyed Activity" value={form.mostEnjoyedActivity} onChange={(v) => setForm({ ...form, mostEnjoyedActivity: v })} />
            <TextAreaField label="Weekly Star Moment" value={form.weeklyStarMoment} onChange={(v) => setForm({ ...form, weeklyStarMoment: v })} />
            <TextAreaField label="Teacher's Note" value={form.teacherNote} onChange={(v) => setForm({ ...form, teacherNote: v })} />
          </div>

          {message && <p className="text-sm">{message}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl2 bg-ns-purple text-white font-semibold">{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="px-4 py-2.5 rounded-xl2 border border-red-400 text-red-500 font-semibold">Delete</button>
          </div>
        </form>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-red-600 mb-2">Delete this assessment?</h3>
            <p className="text-sm text-gray-600 mb-4">This will remove it from reports and dashboards. It can be recovered from the sheet's AuditLog if needed, but there's no undo button in the app.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl2 border">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 rounded-xl2 bg-red-600 text-white font-semibold">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} className="w-full border rounded-lg p-2 text-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
