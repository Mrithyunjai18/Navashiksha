import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { appendRow, readTab, newId } from '@/lib/sheets';

interface AssessmentRow { studentId: string; weekStartDate: string; isDeleted: string }

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { studentId, weekStartDate, workingDays, daysPresent, status } = body;

  if (daysPresent > workingDays)
    return NextResponse.json({ error: 'Days present cannot exceed working days.' }, { status: 400 });

  // duplicate-week guard
  const existingRows = await readTab<AssessmentRow>('Assessments');
  const dup = existingRows.find((r) => r.studentId === studentId && r.weekStartDate === weekStartDate && r.isDeleted !== 'true');
  if (dup) {
    return NextResponse.json({
      error: 'DUPLICATE_WEEK',
      message: 'An assessment already exists for this student for this week. Do you want to edit the existing assessment instead?',
    }, { status: 409 });
  }

  const attendancePct = Math.round((daysPresent / workingDays) * 1000) / 10;
  const id = newId('AS');
  const now = new Date().toISOString();

  await appendRow('Assessments', {
    id, studentId, weekStartDate, assessmentDate: now.slice(0, 10),
    workingDays, daysPresent, attendancePct, status,
    parentConcernCodes: (body.parentConcerns ?? []).map((c: any) => c.concernId).join('|'),
    parentConcernSigns: (body.parentConcerns ?? []).map((c: any) => c.signs?.join(';')).join('|'),
    parentConcernSchoolSupport: (body.parentConcerns ?? []).map((c: any) => c.school?.join(';')).join('|'),
    parentConcernHomeTips: (body.parentConcerns ?? []).map((c: any) => c.home?.join(';')).join('|'),
    parentConcernNote: (body.parentConcerns ?? []).map((c: any) => c.note ?? '').join('|'),
    socialEmotional: Object.entries(body.socialEmotional ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join('|'),
    learningReadiness: Object.entries(body.learningReadiness ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join('|'),
    language: body.language ?? '', maths: body.maths ?? '', concepts: body.concepts ?? '',
    letterRecognition: body.recognition?.letter ?? '', numberRecognition: body.recognition?.number ?? '',
    shapeRecognition: body.recognition?.shape ?? '', colourRecognition: body.recognition?.colour ?? '',
    mostEnjoyedActivity: body.mostEnjoyedActivity ?? '', weeklyStarMoment: body.weeklyStarMoment ?? '',
    focusAreas: (body.focusAreaIds ?? []).join('|'),
    schoolActivities: (body.schoolActivities ?? []).join('|'),
    homeActivities: (body.homeActivities ?? []).join('|'),
    teacherNote: body.teacherNote ?? '',
    createdBy: session.user?.email, createdAt: now, isDeleted: 'false',
  });

  return NextResponse.json({ id, status }, { status: 201 });
}
