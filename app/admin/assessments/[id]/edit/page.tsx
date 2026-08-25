'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const PROGRESS_LEVELS = ['', 'NEEDS_SUPPORT', 'DEVELOPING', 'GOOD', 'EXCELLENT'];
const PROGRESS_LABELS: Record<string, string> = { '': '—', NEEDS_SUPPORT: 'Needs Support', DEVELOPING: 'Developing', GOOD: 'Good', EXCELLENT: 'Excellent' };

function unpack(field: string): Record<string, string> {
  if (!field) return {};
  return Object.fromEntries(field.split('|').filter(Boolean).map((kv) => { const i = kv.indexOf(':'); return [kv.slice(0, i), kv.slice(i + 1)]; }));
}
function pack(obj: Record<string, string>): string {
  return Object.entries(obj).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join('|');
}
function unpackList(field: string): string[] { return (field || '').split('|').filter(Boolean); }
function packList(arr: string[]): string { return arr.filter(Boolean).join('|'); }

export default function EditAssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState<any>(null);
  const [master, setMaster] = useState<any>(null);
  const [social, setSocial] = useState<Record<string, string>>({});
  const [readiness, setReadiness] = useState<Record<string, string>>({});
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [schoolActivities, setSchoolActivities] = useState<string[]>([]);
  const [homeActivities, setHomeActivities] = useState<string[]>([]);
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
      setSocial(unpack(data.socialEmotional));
      setReadiness(unpack(data.learningReadiness));
      setFocusAreas(unpackList(data.focusAreas));
      setSchoolActivities(unpackList(data.schoolActivities));
      setHomeActivities(unpackList(data.homeActivities));
    });
    fetch('/api/form-master').then((r) => r.json()).then(setMaster);
  }, [id]);

  function toggleList(list: string[], setList: (v: string[]) => void, label: string) {
    setList(list.includes(label) ? list.filter((l) => l !== label) : [...list, label]);
  }

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
        socialEmotional: pack(social), learningReadiness: pack(readiness),
        focusAreas: packList(focusAreas), schoolActivities: packList(schoolActivities), homeActivities: packList(homeActivities),
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

  if (!form || !master) return <main className="p-6 text-center text-gray-400">Loading…</main>;

  return (
    <main className="min-h-screen bg-ns-cream p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Edit Assessment</h1>
          <div className="flex gap-3 text-sm">
            <Link href={`/report/${id}`} className="text-ns-blue">View Report</Link>
            <Link href="/admin" className="text-ns-blue">← Dashboard</Link>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Attendance & Status">
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
          </Section>

          <Section title="Social & Emotional Development">
            {master.socialAreas.map((a: any) => (
              <ProgressRow key={a.id} label={a.label} value={social[a.label] || ''} onChange={(v) => setSocial({ ...social, [a.label]: v })} />
            ))}
          </Section>

          <Section title="Learning Readiness">
            {master.readinessAreas.map((a: any) => (
              <ProgressRow key={a.id} label={a.label} value={readiness[a.label] || ''} onChange={(v) => setReadiness({ ...readiness, [a.label]: v })} />
            ))}
          </Section>

          <Section title="Language / Maths / Concepts">
            <Field label="Language" value={form.language} onChange={(v) => setForm({ ...form, language: v })} />
            <Field label="Maths" value={form.maths} onChange={(v) => setForm({ ...form, maths: v })} />
            <Field label="Concepts" value={form.concepts} onChange={(v) => setForm({ ...form, concepts: v })} />
          </Section>

          <Section title="Recognition">
            <div className="grid grid-cols-2 gap-3">
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
          </Section>

          <Section title="Activities">
            <TextAreaField label="Most Enjoyed Activity" value={form.mostEnjoyedActivity} onChange={(v) => setForm({ ...form, mostEnjoyedActivity: v })} />
            <TextAreaField label="Weekly Star Moment" value={form.weeklyStarMoment} onChange={(v) => setForm({ ...form, weeklyStarMoment: v })} />
          </Section>

          <Section title="Focus Areas for Next Week">
            <ChipGroup options={master.focusAreas.map((f: any) => f.label)} selected={focusAreas} onToggle={(l) => toggleList(focusAreas, setFocusAreas, l)} />
          </Section>

          <Section title="School Activities Conducted">
            <ChipGroup options={master.schoolActivityOptions.map((o: any) => o.label)} selected={schoolActivities} onToggle={(l) => toggleList(schoolActivities, setSchoolActivities, l)} />
          </Section>

          <Section title="Home Activities for Parents">
            <ChipGroup options={master.homeActivityOptions.map((o: any) => o.label)} selected={homeActivities} onToggle={(l) => toggleList(homeActivities, setHomeActivities, l)} />
          </Section>

          <Section title="Teacher's Note">
            <TextAreaField label="Teacher's Note (parent-facing)" value={form.teacherNote} onChange={(v) => setForm({ ...form, teacherNote: v })} />
          </Section>

          {message && <p className="text-sm">{message}</p>}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-ns-cream py-3">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl2 bg-ns-purple text-white font-semibold">{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="px-4 py-2.5 rounded-xl2 border border-red-400 text-red-500 font-semibold">Delete</button>
          </div>
        </form>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl2 p-5 w-full max-w-sm">
            <h3 className="font-bold text-lg text-red-600 mb-2">Delete this assessment?</h3>
            <p className="text-sm text-gray-600 mb-4">This will remove it from reports and dashboards. Recoverable via the sheet's AuditLog only.</p>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl2 shadow-sm p-5">
      <h2 className="font-bold text-ns-purple mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
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
function ProgressRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {PROGRESS_LEVELS.map((lvl) => (
          <button key={lvl} type="button" onClick={() => onChange(lvl)}
            className={`px-3 py-1 rounded-full text-xs border ${value === lvl ? 'bg-ns-green text-white border-ns-green' : 'border-gray-300 text-gray-600'}`}>
            {PROGRESS_LABELS[lvl]}
          </button>
        ))}
      </div>
    </div>
  );
}
function ChipGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (l: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onToggle(o)}
          className={`px-3 py-1.5 rounded-full text-sm border ${selected.includes(o) ? 'bg-ns-purple text-white border-ns-purple' : 'border-gray-300 text-gray-700'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
