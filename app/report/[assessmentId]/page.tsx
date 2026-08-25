import { findRowByKey, readTab } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import ReportShareBar from '@/components/ReportShareBar';
import BackButton from '@/components/BackButton';

const PROGRESS_LABEL: Record<string, string> = { NEEDS_SUPPORT: 'Needs Support', DEVELOPING: 'Developing', GOOD: 'Good', EXCELLENT: 'Excellent' };
const PROGRESS_COLOR: Record<string, string> = { NEEDS_SUPPORT: 'bg-orange-200 text-orange-800', DEVELOPING: 'bg-yellow-200 text-yellow-800', GOOD: 'bg-green-200 text-green-800', EXCELLENT: 'bg-emerald-300 text-emerald-900' };

function unpack(field: string | undefined): Record<string, string> {
  if (!field) return {};
  return Object.fromEntries(field.split('|').filter(Boolean).map((kv) => kv.split(':')));
}
function unpackList(field: string | undefined): string[] {
  return (field || '').split('|').filter(Boolean);
}

export default async function ParentReportPage({ params }: { params: { assessmentId: string } }) {
  const a = await findRowByKey<any>('Assessments', 'id', params.assessmentId);
  if (!a) return notFound();
  const student = await findRowByKey<any>('Students', 'id', a.studentId);
  const concernRows = await readTab<any>('ParentConcerns');

  const social = unpack(a.socialEmotional);
  const readiness = unpack(a.learningReadiness);
  const focusAreas = unpackList(a.focusAreas);
  const schoolActivities = unpackList(a.schoolActivities);
  const homeActivities = unpackList(a.homeActivities);
  const concernCodes = unpackList(a.parentConcernCodes);

  return (
    <main className="bg-ns-cream min-h-screen py-6 px-3 print:p-0">
      <div className="max-w-xl mx-auto mb-3 print:hidden flex justify-between items-center">
        <BackButton />
        <a href={`/admin/assessments/${a.id}/edit`} className="text-ns-purple font-semibold text-sm">Edit (Admin) →</a>
      </div>
      <div id="report-card" className="max-w-xl mx-auto bg-white rounded-xl2 overflow-hidden shadow-lg print:shadow-none">
        <div className="bg-ns-yellow p-5 text-center">
          <p className="text-xs tracking-widest text-ns-pink font-bold">✳ SINCE 2012 ✳</p>
          <h1 className="text-3xl font-extrabold text-ns-purple tracking-wide">NAVASHIKSHA</h1>
          <p className="text-sm font-bold text-emerald-600">PRESCHOOL • PLAYSCHOOL • DAYCARE</p>
          <div className="flex justify-center gap-3 mt-3 text-xs font-bold">
            <span className="bg-white rounded-full px-3 py-1 text-ns-pink">🔺 MONTESSORI</span>
            <span className="bg-white rounded-full px-3 py-1 text-ns-green">🌱 PLAYWAY</span>
            <span className="bg-white rounded-full px-3 py-1 text-ns-blue">⭐ HOLISTIC GROWTH</span>
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-extrabold text-center text-ns-purple mb-4">Weekly Learning & Development Report</h2>

          <div className="bg-ns-cream rounded-xl2 p-4 grid grid-cols-2 gap-y-1 text-sm mb-4">
            <p><strong>Student:</strong> {student?.name}</p>
            <p><strong>Class:</strong> {student?.class}-{student?.section}</p>
            <p><strong>Branch:</strong> {student?.branch}</p>
            <p><strong>Teacher:</strong> {a.createdBy}</p>
            <p className="col-span-2"><strong>Week of:</strong> {a.weekStartDate}</p>
            <p className="col-span-2"><strong>Attendance:</strong> {a.daysPresent} / {a.workingDays} days ({a.attendancePct}%)</p>
          </div>

          {a.weeklyStarMoment && (
            <div className="bg-gradient-to-r from-ns-pink to-ns-purple text-white rounded-xl2 p-4 mb-4 text-center">
              <p className="font-bold text-lg">🌟 Weekly Star Moment</p>
              <p className="mt-1">{a.weeklyStarMoment}</p>
            </div>
          )}

          {(a.language || a.maths || a.concepts) && (
            <Section title="📚 Learning Areas">
              {a.language && <p><strong>Language:</strong> {a.language}</p>}
              {a.maths && <p><strong>Maths:</strong> {a.maths}</p>}
              {a.concepts && <p><strong>Concepts:</strong> {a.concepts}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {a.letterRecognition && <Badge>Letters: {a.letterRecognition}</Badge>}
                {a.numberRecognition && <Badge>Numbers: {a.numberRecognition}</Badge>}
                {a.shapeRecognition && <Badge>Shapes: {a.shapeRecognition}</Badge>}
                {a.colourRecognition && <Badge>Colours: {a.colourRecognition}</Badge>}
              </div>
            </Section>
          )}

          {Object.keys(social).length > 0 && (
            <Section title="💛 Social & Emotional Development">
              <div className="flex flex-wrap gap-2">
                {Object.entries(social).map(([label, level]) => (
                  <span key={label} className={`text-xs rounded-full px-2 py-1 ${PROGRESS_COLOR[level] || 'bg-gray-100'}`}>{label} — {PROGRESS_LABEL[level] || level}</span>
                ))}
              </div>
            </Section>
          )}

          {Object.keys(readiness).length > 0 && (
            <Section title="🧠 Learning Readiness">
              <div className="flex flex-wrap gap-2">
                {Object.entries(readiness).map(([label, level]) => (
                  <span key={label} className={`text-xs rounded-full px-2 py-1 ${PROGRESS_COLOR[level] || 'bg-gray-100'}`}>{label} — {PROGRESS_LABEL[level] || level}</span>
                ))}
              </div>
            </Section>
          )}

          {a.mostEnjoyedActivity && <Section title="🎨 Favourite Activity"><p>{a.mostEnjoyedActivity}</p></Section>}

          {focusAreas.length > 0 && <Section title="🎯 Focus for Next Week"><div className="flex flex-wrap gap-2">{focusAreas.map((f) => <Badge key={f}>{f}</Badge>)}</div></Section>}
          {schoolActivities.length > 0 && <Section title="🏫 What We Did at School"><ul className="list-disc pl-5">{schoolActivities.map((s) => <li key={s}>{s}</li>)}</ul></Section>}
          {homeActivities.length > 0 && <Section title="🏠 Try This at Home"><ul className="list-disc pl-5">{homeActivities.map((s) => <li key={s}>{s}</li>)}</ul></Section>}

          {concernCodes.length > 0 && (
            <Section title="🤝 Following Up On Your Concern">
              {concernCodes.map((code) => {
                const c = concernRows.find((r) => r.code === code);
                return c ? <p key={code} className="font-semibold">{c.title}</p> : null;
              })}
            </Section>
          )}

          {a.teacherNote && <Section title="💌 Teacher's Note"><p className="italic">{a.teacherNote}</p></Section>}
        </div>

        <div className="bg-ns-purple text-white text-center text-xs py-3">Navashiksha Preschool • Playschool • Daycare — Since 2012</div>
      </div>

      <ReportShareBar targetId="report-card" fileName={`${student?.name?.replace(/\s+/g, '_') || 'student'}_Week_${a.weekStartDate}`} />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-4"><p className="font-bold text-ns-purple mb-1">{title}</p><div className="text-sm text-gray-700 space-y-1">{children}</div></div>;
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-ns-yellow/60 text-ns-purple rounded-full px-2 py-1 font-medium">{children}</span>;
}
