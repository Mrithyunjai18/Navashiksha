'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AttendanceRing, SkillBar } from '@/components/ReportCharts';
import { isAdminRole } from '@/lib/roles';

function mondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export default function WeeklyDigestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weekStartDate, setWeekStartDate] = useState(mondayOfCurrentWeek());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && !isAdminRole((session?.user as any)?.role)) router.push('/teacher/assessment');
  }, [status, session]);

  async function loadWeek() {
    setLoading(true); setError(''); setData(null);
    const res = await fetch(`/api/admin/weekly-digest?weekStartDate=${weekStartDate}`);
    const result = await res.json();
    setLoading(false);
    if (!res.ok) { setError(result.error); return; }
    setData(result);
  }
  useEffect(() => { loadWeek(); }, []);

  async function generateAllAsZip() {
    if (!data || data.reports.length === 0) return;
    setGenerating(true);
    setProgress({ done: 0, total: data.reports.length });

    const html2canvas = (await import('html2canvas')).default;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const r of data.reports) {
      const el = cardRefs.current[r.id];
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
      if (blob) zip.file(`${r.student.name.replace(/\s+/g, '_')}_${r.weekStartDate}.png`, blob);
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url; a.download = `Navashiksha_Reports_${weekStartDate}.zip`; a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">Weekly Digest</h1>
          <Link href="/admin" className="text-ns-blue text-sm">← Dashboard</Link>
        </div>
        <p className="text-sm text-gray-500 mb-4">Generate every submitted report for a week in one go — downloads as a zip of images ready to share on WhatsApp, one per student.</p>

        <div className="bg-white rounded-xl2 shadow-sm p-5 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Week Starting</label>
            <input type="date" className="w-full border rounded-lg p-2 text-sm" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} />
          </div>
          <button onClick={loadWeek} disabled={loading} className="px-4 py-2 rounded-xl2 border border-ns-purple text-ns-purple font-semibold text-sm">{loading ? 'Loading…' : 'Load Week'}</button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {data && (
          <>
            <div className="bg-white rounded-xl2 shadow-sm p-5 mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-ns-purple">{data.reports.length} submitted report{data.reports.length !== 1 ? 's' : ''} this week</p>
                {data.missingCount > 0 && <p className="text-xs text-orange-600">{data.missingCount} student{data.missingCount !== 1 ? 's' : ''} not yet submitted</p>}
              </div>
              {data.missingCount > 0 && (
                <p className="text-xs text-gray-400 mb-3">Missing: {data.missingNames.slice(0, 8).join(', ')}{data.missingNames.length > 8 ? '…' : ''}</p>
              )}
              <button onClick={generateAllAsZip} disabled={generating || data.reports.length === 0}
                className="w-full py-2.5 rounded-xl2 bg-ns-purple text-white font-semibold disabled:opacity-50">
                {generating ? `Generating ${progress.done}/${progress.total}…` : `📦 Generate All ${data.reports.length} Reports (ZIP)`}
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">Downloads a zip of PNG images — open it, then share each image individually on WhatsApp.</p>
            </div>

            {data.reports.length === 0 && <p className="text-sm text-gray-400 text-center">No submitted assessments for this week yet.</p>}

            {/* Hidden off-screen report cards used only for screenshot capture */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
              {data.reports.map((r: any) => (
                <div key={r.id} ref={(el) => { cardRefs.current[r.id] = el; }} style={{ width: 500 }} className="bg-white rounded-xl2 overflow-hidden">
                  <div className="bg-ns-yellow p-5 text-center">
                    <p className="text-xs tracking-widest text-ns-pink font-bold">✳ SINCE 2012 ✳</p>
                    <h1 className="text-2xl font-extrabold text-ns-purple">NAVASHIKSHA</h1>
                    <p className="text-xs font-bold text-emerald-600">PRESCHOOL • PLAYSCHOOL • DAYCARE</p>
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-extrabold text-center text-ns-purple mb-3">Weekly Learning & Development Report</h2>
                    <div className="bg-ns-cream rounded-xl2 p-4 mb-4">
                      <div className="grid grid-cols-2 gap-y-1 text-sm mb-3">
                        <p><strong>Student:</strong> {r.student.name}</p>
                        <p><strong>Class:</strong> {r.student.class}-{r.student.section}</p>
                        <p><strong>Branch:</strong> {r.student.branch}</p>
                        <p><strong>Teacher:</strong> {r.createdBy}</p>
                      </div>
                      <div className="flex flex-col items-center border-t pt-3">
                        <AttendanceRing pct={Number(r.attendancePct) || 0} />
                        <p className="text-xs text-gray-500 mt-1">{r.daysPresent} / {r.workingDays} days present</p>
                      </div>
                    </div>
                    {r.weeklyStarMoment && (
                      <div className="bg-gradient-to-r from-ns-pink to-ns-purple text-white rounded-xl2 p-4 mb-4 text-center">
                        <p className="font-bold text-lg">🌟 Weekly Star Moment</p>
                        <p className="mt-1">{r.weeklyStarMoment}</p>
                      </div>
                    )}
                    {Object.keys(r.social).length > 0 && (
                      <div className="mb-3"><p className="font-bold text-ns-purple mb-1 text-sm">💛 Social & Emotional Development</p>
                        {Object.entries(r.social).map(([label, level]: any) => <SkillBar key={label} label={label} level={level} />)}
                      </div>
                    )}
                    {Object.keys(r.readiness).length > 0 && (
                      <div className="mb-3"><p className="font-bold text-ns-purple mb-1 text-sm">🧠 Learning Readiness</p>
                        {Object.entries(r.readiness).map(([label, level]: any) => <SkillBar key={label} label={label} level={level} />)}
                      </div>
                    )}
                    {r.mostEnjoyedActivity && <div className="mb-3"><p className="font-bold text-ns-purple mb-1 text-sm">🎨 Favourite Activity</p><p className="text-sm">{r.mostEnjoyedActivity}</p></div>}
                    {r.focusAreas.length > 0 && (
                      <div className="mb-3"><p className="font-bold text-ns-purple mb-1 text-sm">🎯 Focus for Next Week</p>
                        <div className="flex flex-wrap gap-2">{r.focusAreas.map((f: string) => <span key={f} className="text-xs bg-ns-yellow/60 text-ns-purple rounded-full px-2 py-1 font-medium">{f}</span>)}</div>
                      </div>
                    )}
                    {r.teacherNote && <div className="mb-1"><p className="font-bold text-ns-purple mb-1 text-sm">💌 Teacher's Note</p><p className="text-sm italic">{r.teacherNote}</p></div>}
                  </div>
                  <div className="bg-ns-purple text-white text-center text-xs py-3">Navashiksha Preschool • Playschool • Daycare — Since 2012</div>
                </div>
              ))}
            </div>

            {/* Visible list for reference / individual links */}
            <div className="bg-white rounded-xl2 shadow-sm p-5">
              <h2 className="font-bold text-ns-purple mb-3 text-sm">Included in this batch</h2>
              <div className="space-y-1">
                {data.reports.map((r: any) => (
                  <div key={r.id} className="flex justify-between text-sm border-b last:border-0 py-1.5">
                    <span>{r.student.name} ({r.student.class}-{r.student.section})</span>
                    <Link href={`/report/${r.id}`} className="text-ns-blue text-xs">View →</Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
