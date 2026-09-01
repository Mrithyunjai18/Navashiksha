'use client';

import { useMemo, useState } from 'react';

type ProgressLevel = 'NEEDS_SUPPORT' | 'DEVELOPING' | 'GOOD' | 'EXCELLENT';
type RecognitionLevel = 'NOT_YET_INTRODUCED' | 'WITH_HELP' | 'INDEPENDENT';

interface FormMaster {
  focusAreas: { id: string; label: string }[];
  students: { id: string; name: string; studentCode: string; class: string }[];
  customQuestions?: { id: string; label: string; type: string; options: string; points?: string; parentQuestionId?: string; triggerOption?: string }[];
  concerns?: { code: string; title: string; ageWise: Record<string, string[]>; schoolStrategies: string[]; homeTips: string[] }[];
}

const PROGRESS_LABELS: Record<ProgressLevel, string> = {
  NEEDS_SUPPORT: 'Needs Support', DEVELOPING: 'Developing', GOOD: 'Good', EXCELLENT: 'Excellent',
};

export default function AssessmentForm({ master, previousWeek }: { master: FormMaster; previousWeek?: any }) {
  const [studentId, setStudentId] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [workingDays, setWorkingDays] = useState(5);
  const [daysPresent, setDaysPresent] = useState(5);

  const [focusSelected, setFocusSelected] = useState<string[]>([]);
  const [language, setLanguage] = useState(''); const [maths, setMaths] = useState(''); const [concepts, setConcepts] = useState('');
  const [mostEnjoyed, setMostEnjoyed] = useState(''); const [starMoment, setStarMoment] = useState('');
  const [teacherNote, setTeacherNote] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedConcernCodes, setSelectedConcernCodes] = useState<string[]>([]);
  const [concernStrategies, setConcernStrategies] = useState<Record<string, string[]>>({});
  const [concernHomeTips, setConcernHomeTips] = useState<Record<string, string[]>>({});
  const [concernNotes, setConcernNotes] = useState<Record<string, string>>({});
  const [concernObserved, setConcernObserved] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const attendancePct = useMemo(() => (workingDays ? Math.round((daysPresent / workingDays) * 1000) / 10 : 0), [daysPresent, workingDays]);
  const selectedStudentClass = useMemo(() => master.students.find((s) => s.id === studentId)?.class ?? '', [studentId, master.students]);

  function toggleConcern(code: string) {
    setSelectedConcernCodes((prev) => {
      if (prev.includes(code)) {
        const nextStrat = { ...concernStrategies }; delete nextStrat[code]; setConcernStrategies(nextStrat);
        const nextHome = { ...concernHomeTips }; delete nextHome[code]; setConcernHomeTips(nextHome);
        const nextNotes = { ...concernNotes }; delete nextNotes[code]; setConcernNotes(nextNotes);
        const nextObs = { ...concernObserved }; delete nextObs[code]; setConcernObserved(nextObs);
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  }
  function toggleConcernOption(code: string, bucket: 'school' | 'home' | 'observed', label: string) {
    const setter = bucket === 'school' ? setConcernStrategies : bucket === 'home' ? setConcernHomeTips : setConcernObserved;
    setter((prev) => {
      const arr = prev[code] ?? [];
      return { ...prev, [code]: arr.includes(label) ? arr.filter((l) => l !== label) : [...arr, label] };
    });
  }

  async function submit(finalStatus: 'DRAFT' | 'SUBMITTED') {
    setStatus('saving');
    const payload = {
      studentId, weekStartDate, workingDays, daysPresent, status: finalStatus,
      focusAreaIds: focusSelected, language, maths, concepts,
      mostEnjoyedActivity: mostEnjoyed, weeklyStarMoment: starMoment,
      teacherNote, customAnswers,
      parentConcerns: selectedConcernCodes.map((code) => ({
        concernId: code,
        signs: concernObserved[code] ?? [],
        school: concernStrategies[code] ?? [],
        home: concernHomeTips[code] ?? [],
        note: concernNotes[code] ?? '',
      })),
    };
    const res = await fetch('/api/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setStatus(res.ok ? 'saved' : 'idle');
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Section A — Student & Week */}
      <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4 border border-ns.yellow/40">
        <h2 className="font-bold text-lg mb-3 text-ns-purple">Student & Week</h2>
        <label className="block text-sm font-medium mb-1">Student</label>
        <select className="w-full border rounded-lg p-2 mb-3" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Select student…</option>
          {master.students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentCode})</option>)}
        </select>
        <label className="block text-sm font-medium mb-1">Week starting</label>
        <input type="date" className="w-full border rounded-lg p-2" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} />
      </section>

      {/* Parent Concern — purely manual selection, no auto-linking to any other field */}
      {master.concerns && master.concerns.length > 0 && (
        <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
          <h2 className="font-bold text-lg mb-1 text-ns-purple">Parent Concern (optional)</h2>
          <p className="text-sm text-gray-500 mb-3">If a parent raised a concern this week, select it — you'll see what's typically expected for this child's class, plus quick picks for what you actually did. Nothing here affects any other section of this form.</p>
          <div className="space-y-2">
            {master.concerns.map((c) => {
              const active = selectedConcernCodes.includes(c.code);
              const expectations = selectedStudentClass ? c.ageWise[selectedStudentClass] : undefined;
              return (
                <div key={c.code} className={`rounded-lg border ${active ? 'border-ns-purple bg-ns-purple/5' : 'border-gray-200'}`}>
                  <button type="button" onClick={() => toggleConcern(c.code)} className="w-full text-left p-3 font-medium flex justify-between items-center">
                    {c.title} <span className="text-xs text-gray-400">{active ? '▲' : '▼'}</span>
                  </button>
                  {active && (
                    <div className="p-3 pt-0 space-y-3">
                      {expectations && expectations.length > 0 && (
                        <OptionGroup label={`What's typical for ${selectedStudentClass} — select what you've observed`} options={expectations}
                          selected={concernObserved[c.code] ?? []} onToggle={(l) => toggleConcernOption(c.code, 'observed', l)} />
                      )}
                      <OptionGroup label="Strategies used at school this week" options={c.schoolStrategies}
                        selected={concernStrategies[c.code] ?? []} onToggle={(l) => toggleConcernOption(c.code, 'school', l)} />
                      <OptionGroup label="Home tips given to parent" options={c.homeTips}
                        selected={concernHomeTips[c.code] ?? []} onToggle={(l) => toggleConcernOption(c.code, 'home', l)} />
                      <textarea placeholder="Optional note…" className="w-full border rounded-lg p-2 text-sm"
                        value={concernNotes[c.code] ?? ''} onChange={(e) => setConcernNotes((p) => ({ ...p, [c.code]: e.target.value }))} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section B — Attendance */}
      <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
        <h2 className="font-bold text-lg mb-3 text-ns-purple">Attendance</h2>
        <div className="flex gap-4">
          <div className="flex-1"><label className="text-sm font-medium">Working days</label>
            <input type="number" min={1} max={7} className="w-full border rounded-lg p-2" value={workingDays} onChange={(e) => setWorkingDays(+e.target.value)} /></div>
          <div className="flex-1"><label className="text-sm font-medium">Days present</label>
            <input type="number" min={0} max={workingDays} className="w-full border rounded-lg p-2" value={daysPresent} onChange={(e) => setDaysPresent(+e.target.value)} /></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">Attendance: <strong>{daysPresent} / {workingDays} days — {attendancePct}%</strong> (auto-calculated)</p>
      </section>

      {/* Academic content */}
      <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
        <h2 className="font-bold text-lg mb-3 text-ns-purple">Language / Maths / Concepts</h2>
        <Field label="Language topics covered" value={language} onChange={setLanguage} placeholder="e.g. Revision Aa–Hh and introduction to Ii" />
        <Field label="Maths topics covered" value={maths} onChange={setMaths} placeholder="e.g. Revision 1–5" />
        <Field label="Concepts covered" value={concepts} onChange={setConcepts} placeholder="e.g. Body parts, colouring, matching objects" />
      </section>


      {/* Activities */}
      <section className="bg-ns-yellow/40 rounded-xl2 shadow-sm p-5 mb-4">
        <h2 className="font-bold text-lg mb-3 text-ns-purple">✨ Activities</h2>
        <Field label="Most Enjoyed Activity" value={mostEnjoyed} onChange={setMostEnjoyed} placeholder="e.g. Puppet storytelling" />
        <Field label="Weekly Star Moment" value={starMoment} onChange={setStarMoment} placeholder="A positive, specific observation for the parent report" textarea />
      </section>

      {/* Focus Areas */}
      <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
        <h2 className="font-bold text-lg mb-3 text-ns-purple">Focus Areas for Next Week</h2>
        <OptionGroup options={master.focusAreas.map((f) => f.label)} selected={master.focusAreas.filter((f) => focusSelected.includes(f.id)).map((f) => f.label)}
          onToggle={(label) => { const fa = master.focusAreas.find((f) => f.label === label)!; setFocusSelected((prev) => prev.includes(fa.id) ? prev.filter((id) => id !== fa.id) : [...prev, fa.id]); }} />
      </section>

      {/* Custom Questions (admin-defined) — with Google-Forms-style branching sub-questions */}
      {master.customQuestions && master.customQuestions.length > 0 && (
        <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
          <h2 className="font-bold text-lg mb-3 text-ns-purple">Additional Questions</h2>
          {master.customQuestions.filter((q) => !q.parentQuestionId).map((q) => (
            <CustomQuestionBlock key={q.id} question={q} allQuestions={master.customQuestions!} customAnswers={customAnswers} setCustomAnswers={setCustomAnswers} />
          ))}
        </section>
      )}

      <section className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
        <Field label="Teacher's Note (parent-facing)" value={teacherNote} onChange={setTeacherNote} textarea placeholder="A warm, specific note for the parent report…" />
      </section>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-3 max-w-2xl mx-auto">
        <button onClick={() => submit('DRAFT')} disabled={!studentId || status === 'saving'} className="flex-1 py-3 rounded-xl2 border border-ns-purple text-ns-purple font-semibold">Save Draft</button>
        <button onClick={() => submit('SUBMITTED')} disabled={!studentId || status === 'saving'} className="flex-1 py-3 rounded-xl2 bg-ns-purple text-white font-semibold">
          {status === 'saving' ? 'Submitting…' : status === 'saved' ? 'Submitted ✓' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
}

function OptionGroup({ label, options, selected, onToggle }: { label?: string; options: string[]; selected: string[]; onToggle: (l: string) => void }) {
  return (
    <div>
      {label && <p className="text-sm font-medium mb-1">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-sm border ${selected.includes(o) ? 'bg-ns-purple text-white border-ns-purple' : 'border-gray-300 text-gray-700'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, onChange }: { label: string; value: ProgressLevel | ''; onChange: (v: ProgressLevel) => void }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-medium mb-1">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PROGRESS_LABELS) as ProgressLevel[]).map((k) => (
          <button key={k} type="button" onClick={() => onChange(k)}
            className={`px-3 py-1.5 rounded-full text-sm border ${value === k ? 'bg-ns-green text-white border-ns-green' : 'border-gray-300 text-gray-700'}`}>
            {PROGRESS_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">{label}</label>
      {textarea
        ? <textarea className="w-full border rounded-lg p-2" rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="w-full border rounded-lg p-2" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function CustomQuestionBlock({
  question, allQuestions, customAnswers, setCustomAnswers,
}: {
  question: { id: string; label: string; type: string; options: string };
  allQuestions: { id: string; label: string; type: string; options: string; parentQuestionId?: string; triggerOption?: string }[];
  customAnswers: Record<string, string | string[]>;
  setCustomAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
}) {
  const opts = (question.options || '').split(',').map((o) => o.trim()).filter(Boolean);
  const value = customAnswers[question.id];

  const children = allQuestions.filter((q) => q.parentQuestionId === question.id);
  const currentAnswerList = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <div className="mb-3">
      {question.type === 'text' && <Field label={question.label} value={(value as string) ?? ''} onChange={(v) => setCustomAnswers((p) => ({ ...p, [question.id]: v }))} />}
      {question.type === 'textarea' && <Field label={question.label} value={(value as string) ?? ''} onChange={(v) => setCustomAnswers((p) => ({ ...p, [question.id]: v }))} textarea />}
      {question.type === 'single_select' && (
        <div>
          <p className="text-sm font-medium mb-1">{question.label}</p>
          <OptionGroup options={opts} selected={value ? [value as string] : []} onToggle={(l) => setCustomAnswers((p) => ({ ...p, [question.id]: l }))} />
        </div>
      )}
      {question.type === 'multi_select' && (
        <div>
          <p className="text-sm font-medium mb-1">{question.label}</p>
          <OptionGroup options={opts} selected={(value as string[]) ?? []}
            onToggle={(l) => setCustomAnswers((p) => { const arr = (p[question.id] as string[]) ?? []; return { ...p, [question.id]: arr.includes(l) ? arr.filter((x) => x !== l) : [...arr, l] }; })} />
        </div>
      )}

      {children.length > 0 && (
        <div className="ml-4 mt-2 pl-3 border-l-2 border-ns-purple/20 space-y-3">
          {children
            .filter((child) => currentAnswerList.includes(child.triggerOption || ''))
            .map((child) => (
              <CustomQuestionBlock key={child.id} question={child} allQuestions={allQuestions} customAnswers={customAnswers} setCustomAnswers={setCustomAnswers} />
            ))}
        </div>
      )}
    </div>
  );
}
