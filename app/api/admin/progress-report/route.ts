import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, findRowByKey } from '@/lib/sheets';
import { isAdminRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

const LEVEL_SCORE: Record<string, number> = { NEEDS_SUPPORT: 1, DEVELOPING: 2, GOOD: 3, EXCELLENT: 4 };

function unpack(field: string): Record<string, string> {
  if (!field) return {};
  return Object.fromEntries(field.split('|').filter(Boolean).map((kv) => { const i = kv.indexOf(':'); return [kv.slice(0, i), kv.slice(i + 1)]; }));
}
function unpackList(field: string): string[] { return (field || '').split('|').filter(Boolean); }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to');

  if (!studentId || !from || !to) return NextResponse.json({ error: 'studentId, from and to are required.' }, { status: 400 });

  const student = await findRowByKey<any>('Students', 'id', studentId);
  if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  const all = await readTab<any>('Assessments');
  const rows = all
    .filter((a) => a.studentId === studentId && a.isDeleted !== 'true' && a.weekStartDate >= from && a.weekStartDate <= to)
    .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

  if (rows.length === 0) return NextResponse.json({ student, weeks: [], summary: null });

  // Attendance trend
  const attendanceTrend = rows.map((r) => ({ week: r.weekStartDate, pct: Number(r.attendancePct) || 0 }));
  const avgAttendance = Math.round((attendanceTrend.reduce((s, r) => s + r.pct, 0) / attendanceTrend.length) * 10) / 10;

  // Social/Emotional + Learning Readiness trends — track score progression per area
  const socialSeries: Record<string, { week: string; score: number }[]> = {};
  const readinessSeries: Record<string, { week: string; score: number }[]> = {};

  for (const r of rows) {
    const social = unpack(r.socialEmotional);
    for (const [area, level] of Object.entries(social)) {
      if (!LEVEL_SCORE[level]) continue;
      (socialSeries[area] ??= []).push({ week: r.weekStartDate, score: LEVEL_SCORE[level] });
    }
    const readiness = unpack(r.learningReadiness);
    for (const [area, level] of Object.entries(readiness)) {
      if (!LEVEL_SCORE[level]) continue;
      (readinessSeries[area] ??= []).push({ week: r.weekStartDate, score: LEVEL_SCORE[level] });
    }
  }

  function summarizeTrend(series: Record<string, { week: string; score: number }[]>) {
    const improving: string[] = [];
    const steady: string[] = [];
    const needsAttention: string[] = [];
    for (const [area, points] of Object.entries(series)) {
      if (points.length === 0) continue;
      const first = points[0].score, last = points[points.length - 1].score;
      const avg = points.reduce((s, p) => s + p.score, 0) / points.length;
      if (last > first) improving.push(area);
      else if (avg <= 1.5) needsAttention.push(area);
      else steady.push(area);
    }
    return { improving, steady, needsAttention };
  }

  const socialSummary = summarizeTrend(socialSeries);
  const readinessSummary = summarizeTrend(readinessSeries);

  // Recognition progression (last known value per type)
  const recognitionFinal = {
    letter: rows.filter((r) => r.letterRecognition).slice(-1)[0]?.letterRecognition || null,
    number: rows.filter((r) => r.numberRecognition).slice(-1)[0]?.numberRecognition || null,
    shape: rows.filter((r) => r.shapeRecognition).slice(-1)[0]?.shapeRecognition || null,
    colour: rows.filter((r) => r.colourRecognition).slice(-1)[0]?.colourRecognition || null,
  };

  // Star moments + activities across the period
  const starMoments = rows.filter((r) => r.weeklyStarMoment).map((r) => ({ week: r.weekStartDate, text: r.weeklyStarMoment }));
  const enjoyedActivities = rows.filter((r) => r.mostEnjoyedActivity).map((r) => r.mostEnjoyedActivity);

  // Most frequent focus areas raised (signals recurring areas needing improvement)
  const focusCounts: Record<string, number> = {};
  for (const r of rows) for (const f of unpackList(r.focusAreas)) focusCounts[f] = (focusCounts[f] || 0) + 1;
  const topFocusAreas = Object.entries(focusCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));

  return NextResponse.json({
    student,
    weeksCount: rows.length,
    dateRange: { from, to },
    attendanceTrend,
    avgAttendance,
    socialSummary,
    readinessSummary,
    recognitionFinal,
    starMoments,
    enjoyedActivities,
    topFocusAreas,
  });
}
