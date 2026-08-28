'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReportShareBar from '@/components/ReportShareBar';
import { AttendanceTrendChart, AttendanceRing, SkillBar } from '@/components/ReportCharts';
import { isAdminRole } from '@/lib/roles';

const LEVEL_LABEL: Record<string, string> = { NOT_YET_INTRODUCED: 'Not yet introduced', WITH_HELP: 'With help', INDEPENDENT: 'Independent' };

function firstOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function ProgressReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [from, setFrom] = useState(firstOfMonth(new Date()));
  const [to, setTo] = useState(today());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && !isAdminRole((session?.user as any)?.role)) router.push('/teacher/assessment');
  }, [status, session]);

  useEffect(() => { fetch('/api/admin/students').then((r) => r.json()).then(setStudents); }, []);

  async function generate() {
    if (!studentId) { setError('Select a student first.'); return; }
    setLoading(true); setError(''); setData(null);
    const res = await fetch(`/api/admin/progress-report?studentId=${studentId}&from=${from}&to=${to}`);
    const result = await res.json();
    setLoading(false);
    if (!res.ok) { setError(result.error); return; }
    if (result.weeks && result.weeks.length === 0 && !result.summary) { setError('No assessments found for this student in the selected period.'); return; }
    setData(result);
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Progress Report</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Dashboard</Link>
        </div>

        <div className="bg-white rounded-xl2 shadow-sm p-5 mb-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student</label>
            <select className="w-full border rounded-lg p-2 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentCode})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input type="date" className="w-full border rounded-lg p-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input type="date" className="w-full border rounded-lg p-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="w-full py-2.5 rounded-xl2 bg-ns-purple text-white font-semibold">
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {data && (
          <>
            <div id="progress-report-card" className="bg-white rounded-xl2 overflow-hidden shadow-lg">
              <div className="bg-ns-yellow p-5 text-center">
                <p className="text-xs tracking-widest text-ns-pink font-bold">✳ SINCE 2012 ✳</p>
                <h1 className="text-2xl font-extrabold text-ns-purple">NAVASHIKSHA</h1>
                <p className="text-xs font-bold text-emerald-600">PRESCHOOL • PLAYSCHOOL • DAYCARE</p>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-extrabold text-center text-ns-purple mb-1">Progress Report</h2>
                <p className="text-center text-sm text-gray-500 mb-4">{data.student.name} · {new Date(data.dateRange.from).toLocaleDateString()} – {new Date(data.dateRange.to).toLocaleDateString()} · {data.weeksCount} week{data.weeksCount !== 1 ? 's' : ''} assessed</p>

                <div className="bg-ns-cream rounded-xl2 p-4 mb-4">
                  <div className="flex items-center justify-around">
                    <AttendanceRing pct={data.avgAttendance} />
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-ns-purple">{data.weeksCount}</p>
                      <p className="text-xs text-gray-500">Weeks Assessed</p>
                    </div>
                  </div>
                  {data.attendanceTrend.length > 1 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1 text-center">Attendance Trend</p>
                      <AttendanceTrendChart data={data.attendanceTrend} />
                    </div>
                  )}
                </div>

                <RepSection title="🌱 Improving Areas" empty="No clear upward trend yet — steady progress across the board.">
                  {[...data.socialSummary.improving, ...data.readinessSummary.improving].map((a: string) => <Badge key={a} color="green">{a}</Badge>)}
                </RepSection>

                <RepSection title="✅ Steady / Consistent Areas" empty="—">
                  {[...data.socialSummary.steady, ...data.readinessSummary.steady].map((a: string) => <Badge key={a} color="blue">{a}</Badge>)}
                </RepSection>

                <RepSection title="🎯 Areas Needing Improvement" empty="None flagged — great month overall!">
                  {[...data.socialSummary.needsAttention, ...data.readinessSummary.needsAttention].map((a: string) => <Badge key={a} color="orange">{a}</Badge>)}
                </RepSection>

                {data.topFocusAreas.length > 0 && (
                  <RepSection title="🔁 Most Recurring Focus Areas">
                    {data.topFocusAreas.map((f: any) => <Badge key={f.label} color="purple">{f.label} ({f.count}x)</Badge>)}
                  </RepSection>
                )}

                <RepSection title="🔤 Recognition Progress (latest)">
                  <div className="flex flex-wrap gap-2">
                    {data.recognitionFinal.letter && <Badge color="gray">Letters: {LEVEL_LABEL[data.recognitionFinal.letter]}</Badge>}
                    {data.recognitionFinal.number && <Badge color="gray">Numbers: {LEVEL_LABEL[data.recognitionFinal.number]}</Badge>}
                    {data.recognitionFinal.shape && <Badge color="gray">Shapes: {LEVEL_LABEL[data.recognitionFinal.shape]}</Badge>}
                    {data.recognitionFinal.colour && <Badge color="gray">Colours: {LEVEL_LABEL[data.recognitionFinal.colour]}</Badge>}
                  </div>
                </RepSection>

                {data.starMoments.length > 0 && (
                  <RepSection title="⭐ Star Moments This Period">
                    {data.starMoments.map((s: any, i: number) => (
                      <p key={i} className="text-sm mb-1"><span className="text-gray-400">{new Date(s.week).toLocaleDateString()}:</span> {s.text}</p>
                    ))}
                  </RepSection>
                )}
              </div>
              <div className="bg-ns-purple text-white text-center text-xs py-3">Navashiksha Preschool • Playschool • Daycare — Since 2012</div>
            </div>
            <ReportShareBar targetId="progress-report-card" fileName={`${data.student.name.replace(/\s+/g, '_')}_Progress_${data.dateRange.from}_to_${data.dateRange.to}`} />
          </>
        )}
      </div>
    </main>
  );
}

function RepSection({ title, children, empty }: { title: string; children: React.ReactNode; empty?: string }) {
  const hasContent = Array.isArray(children) ? (children as any[]).some(Boolean) : !!children;
  return (
    <div className="mb-4">
      <p className="font-bold text-ns-purple mb-1 text-sm">{title}</p>
      {hasContent ? <div className="flex flex-wrap gap-2">{children}</div> : <p className="text-xs text-gray-400">{empty}</p>}
    </div>
  );
}
function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'blue' | 'orange' | 'purple' | 'gray' }) {
  const colors = { green: 'bg-green-100 text-green-800', blue: 'bg-blue-100 text-blue-800', orange: 'bg-orange-100 text-orange-800', purple: 'bg-purple-100 text-purple-800', gray: 'bg-gray-100 text-gray-700' };
  return <span className={`text-xs rounded-full px-2 py-1 font-medium ${colors[color]}`}>{children}</span>;
}
