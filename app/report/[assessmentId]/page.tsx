import { findRowByKey, readTab } from '@/lib/sheets';
import { notFound } from 'next/navigation';
import ReportShareBar from '@/components/ReportShareBar';
import BackButton from '@/components/BackButton';
import DeleteReportButton from '@/components/DeleteReportButton';
import ReportHeader from '@/components/ReportHeader';
import ShareToWhatsAppButton from '@/components/ShareToWhatsAppButton';
import EditReportLink from '@/components/EditReportLink';
import { AttendanceRing, SkillBar } from '@/components/ReportCharts';
import { headers } from 'next/headers';

const PROGRESS_LABEL: Record<string, string> = { NEEDS_SUPPORT: 'Needs Support', DEVELOPING: 'Developing', GOOD: 'Good', EXCELLENT: 'Excellent' };
const PROGRESS_COLOR: Record<string, string> = { NEEDS_SUPPORT: 'bg-orange-200 text-orange-800', DEVELOPING: 'bg-yellow-200 text-yellow-800', GOOD: 'bg-green-200 text-green-800', EXCELLENT: 'bg-emerald-300 text-emerald-900' };
const RECOG_LABEL: Record<string, string> = { NOT_YET_INTRODUCED: 'Not yet introduced', WITH_HELP: 'With help', INDEPENDENT: 'Independent' };

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
  const customQuestions = await readTab<any>('CustomQuestions');
  const customAnswerRows = (await readTab<any>('CustomAnswers')).filter((r) => r.assessmentId === a.id);

  const host = headers().get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const reportUrl = `${protocol}://${host}/report/${a.id}`;

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
        <div className="flex items-center gap-3">
          <EditReportLink assessmentId={a.id} />
          <DeleteReportButton assessmentId={a.id} />
        </div>
      </div>
      <div id="report-card" className="max-w-xl mx-auto bg-white rounded-xl2 overflow-hidden shadow-lg print:shadow-none">
        <ReportHeader />

        <div className="p-5">
          <h2 className="text-xl font-extrabold text-center text-ns-purple mb-4">Weekly Learning & Development Report</h2>

          <div className="bg-ns-cream rounded-xl2 p-4 mb-4">
            <div className="grid grid-cols-2 gap-y-1 text-sm mb-3">
              <p><strong>Student:</strong> {student?.name}</p>
              <p><strong>Class:</strong> {student?.class}-{student?.section}</p>
              <p><strong>Branch:</strong> {student?.branch}</p>
              <p><strong>Teacher:</strong> {a.createdBy}</p>
              <p className="col-span-2"><strong>Week of:</strong> {a.weekStartDate}</p>
            </div>
            <div className="flex flex-col items-center border-t pt-3">
              <AttendanceRing pct={Number(a.attendancePct) || 0} />
              <p className="text-xs text-gray-500 mt-1">{a.daysPresent} / {a.workingDays} days present</p>
            </div>
          </div>

          {a.weeklyStarMoment && (
            <div className="bg-gradient-to-r from-ns-pink to-ns-purple text-white rounded-xl2 p-4 mb-4 text-center">
              <p className="font-bold text-lg">🌟 Weekly Star Moment</p>
              <p className="mt-1">{a.weeklyStarMoment}</p>
            </div>
          )}

          {(a.language || a.maths || a.concepts || a.letterRecognition || a.numberRecognition || a.shapeRecognition || a.colourRecognition) && (
            <Section title="📚 Learning Areas">
              {a.language && <p><strong>Language:</strong> {a.language}</p>}
              {a.maths && <p><strong>Maths:</strong> {a.maths}</p>}
              {a.concepts && <p><strong>Concepts:</strong> {a.concepts}</p>}
              {(a.letterRecognition || a.numberRecognition || a.shapeRecognition || a.colourRecognition) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {a.letterRecognition && <Badge>Letters: {RECOG_LABEL[a.letterRecognition] || a.letterRecognition}</Badge>}
                  {a.numberRecognition && <Badge>Numbers: {RECOG_LABEL[a.numberRecognition] || a.numberRecognition}</Badge>}
                  {a.shapeRecognition && <Badge>Shapes: {RECOG_LABEL[a.shapeRecognition] || a.shapeRecognition}</Badge>}
                  {a.colourRecognition && <Badge>Colours: {RECOG_LABEL[a.colourRecognition] || a.colourRecognition}</Badge>}
                </div>
              )}
            </Section>
          )}

          {Object.keys(social).length > 0 && (
            <Section title="💛 Social & Emotional Development">
              {Object.entries(social).map(([label, level]) => <SkillBar key={label} label={label} level={level} />)}
            </Section>
          )}

          {Object.keys(readiness).length > 0 && (
            <Section title="🧠 Learning Readiness">
              {Object.entries(readiness).map(([label, level]) => <SkillBar key={label} label={label} level={level} />)}
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

          {customAnswerRows.length > 0 && (
            <Section title="📝 Additional Notes">
              {customAnswerRows.map((ans) => {
                const q = customQuestions.find((cq) => cq.id === ans.questionId);
                if (!q) return null;
                return <p key={ans.id}><strong>{q.label}:</strong> {ans.answer.replace(/\|/g, ', ')}</p>;
              })}
            </Section>
          )}

          {a.teacherNote && <Section title="💌 Teacher's Note"><p className="italic">{a.teacherNote}</p></Section>}
        </div>

        <div className="bg-ns-purple text-white text-center text-xs py-3">Navashiksha Preschool • Playschool • Daycare — Since 2012</div>
      </div>

      <ReportShareBar targetId="report-card" fileName={`${student?.name?.replace(/\s+/g, '_') || 'student'}_Week_${a.weekStartDate}`} />

      <div className="max-w-xl mx-auto mt-2 flex gap-2 print:hidden">
        <ShareToWhatsAppButton
          targetId="report-card"
          parentName={student?.parentName || ''}
          parentPhone={student?.parentPhone || ''}
          studentName={student?.name || ''}
          studentClass={student ? `${student.class}-${student.section}` : ''}
          reportUrl={reportUrl}
          fileName={`${student?.name?.replace(/\s+/g, '_') || 'student'}_Week_${a.weekStartDate}`}
        />
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-4"><p className="font-bold text-ns-purple mb-1">{title}</p><div className="text-sm text-gray-700 space-y-1">{children}</div></div>;
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs bg-ns-yellow/60 text-ns-purple rounded-full px-2 py-1 font-medium">{children}</span>;
}
