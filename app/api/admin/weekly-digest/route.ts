import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab } from '@/lib/sheets';
import { isAdminRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

function unpack(field: string): Record<string, string> {
  if (!field) return {};
  return Object.fromEntries(field.split('|').filter(Boolean).map((kv) => { const i = kv.indexOf(':'); return [kv.slice(0, i), kv.slice(i + 1)]; }));
}
function unpackList(field: string): string[] { return (field || '').split('|').filter(Boolean); }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStartDate = searchParams.get('weekStartDate');
  if (!weekStartDate) return NextResponse.json({ error: 'weekStartDate is required.' }, { status: 400 });

  const [assessments, students] = await Promise.all([readTab<any>('Assessments'), readTab<any>('Students')]);
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const rows = assessments
    .filter((a) => a.weekStartDate === weekStartDate && a.status === 'SUBMITTED' && a.isDeleted !== 'true')
    .map((a) => ({
      id: a.id,
      student: studentMap[a.studentId] ? { name: studentMap[a.studentId].name, class: studentMap[a.studentId].class, section: studentMap[a.studentId].section, branch: studentMap[a.studentId].branch } : null,
      weekStartDate: a.weekStartDate,
      daysPresent: a.daysPresent, workingDays: a.workingDays, attendancePct: a.attendancePct,
      createdBy: a.createdBy,
      weeklyStarMoment: a.weeklyStarMoment, mostEnjoyedActivity: a.mostEnjoyedActivity,
      social: unpack(a.socialEmotional), readiness: unpack(a.learningReadiness),
      focusAreas: unpackList(a.focusAreas), teacherNote: a.teacherNote,
    }))
    .filter((r) => r.student);

  // Also report which active students in this week have NO submitted assessment yet — useful before generating
  const allActiveIds = students.filter((s) => s.status !== 'Inactive').map((s) => s.id);
  const submittedIds = new Set(assessments.filter((a) => a.weekStartDate === weekStartDate && a.status === 'SUBMITTED' && a.isDeleted !== 'true').map((a) => a.studentId));
  const missing = allActiveIds.filter((id) => !submittedIds.has(id)).map((id) => studentMap[id]?.name).filter(Boolean);

  return NextResponse.json({ weekStartDate, reports: rows, missingCount: missing.length, missingNames: missing });
}
