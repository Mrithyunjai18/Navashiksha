import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { findRowByKey, updateRowByKey, appendRow, newId } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

const EDITABLE_FIELDS = [
  'workingDays', 'daysPresent', 'status',
  'language', 'maths', 'concepts',
  'letterRecognition', 'numberRecognition', 'shapeRecognition', 'colourRecognition',
  'mostEnjoyedActivity', 'weeklyStarMoment', 'teacherNote',
  'socialEmotional', 'learningReadiness', 'focusAreas', 'schoolActivities', 'homeActivities',
];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assessment = await findRowByKey<any>('Assessments', 'id', params.id);
  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = assessment.createdBy?.toLowerCase() === session.user.email!.toLowerCase();
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'You can only edit your own submissions.' }, { status: 403 });

  return NextResponse.json(assessment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const before = await findRowByKey<any>('Assessments', 'id', params.id);
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = before.createdBy?.toLowerCase() === session.user.email!.toLowerCase();
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'You can only edit your own submissions.' }, { status: 403 });

  const body = await req.json();
  const patch: Record<string, any> = {};
  for (const key of EDITABLE_FIELDS) if (key in body) patch[key] = body[key];

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  if (patch.daysPresent !== undefined && patch.workingDays !== undefined) {
    if (Number(patch.daysPresent) > Number(patch.workingDays))
      return NextResponse.json({ error: 'Days present cannot exceed working days.' }, { status: 400 });
    patch.attendancePct = String(Math.round((Number(patch.daysPresent) / Number(patch.workingDays)) * 1000) / 10);
  }

  patch.lastModifiedBy = session.user.email;
  patch.updatedAt = new Date().toISOString();

  const ok = await updateRowByKey('Assessments', 'id', params.id, patch);
  if (!ok) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });

  await appendRow('AuditLog', {
    id: newId('AL'), userEmail: session.user.email, entityType: 'Assessment', entityId: params.id,
    action: 'UPDATE', changes: JSON.stringify(Object.keys(patch)), createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
