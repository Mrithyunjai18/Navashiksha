import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { findRowByKey, updateRowByKey, appendRow, newId } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

const EDITABLE_FIELDS = [
  'weekStartDate', 'assessmentDate', 'workingDays', 'daysPresent', 'status',
  'language', 'maths', 'concepts',
  'letterRecognition', 'numberRecognition', 'shapeRecognition', 'colourRecognition',
  'mostEnjoyedActivity', 'weeklyStarMoment', 'teacherNote',
];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assessment = await findRowByKey<any>('Assessments', 'id', params.id);
  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(assessment);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const before = await findRowByKey<any>('Assessments', 'id', params.id);
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const patch: Record<string, any> = {};
  for (const key of EDITABLE_FIELDS) if (key in body) patch[key] = body[key];

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  if (patch.daysPresent !== undefined && patch.workingDays !== undefined) {
    if (Number(patch.daysPresent) > Number(patch.workingDays))
      return NextResponse.json({ error: 'Days present cannot exceed working days.' }, { status: 400 });
    patch.attendancePct = String(Math.round((Number(patch.daysPresent) / Number(patch.workingDays)) * 1000) / 10);
  }

  patch.lastModifiedBy = session.user?.email;
  patch.updatedAt = new Date().toISOString();

  const ok = await updateRowByKey('Assessments', 'id', params.id, patch);
  if (!ok) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });

  const changes: Record<string, { from: any; to: any }> = {};
  for (const key of Object.keys(patch)) if (before[key] !== patch[key]) changes[key] = { from: before[key], to: patch[key] };
  await appendRow('AuditLog', {
    id: newId('AL'), userEmail: session.user?.email, entityType: 'Assessment', entityId: params.id,
    action: 'UPDATE', changes: JSON.stringify(changes), createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

// DELETE — soft delete with confirmation handled client-side
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await updateRowByKey('Assessments', 'id', params.id, {
    isDeleted: 'true', deletedBy: session.user?.email, deletedAt: new Date().toISOString(),
  });
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await appendRow('AuditLog', {
    id: newId('AL'), userEmail: session.user?.email, entityType: 'Assessment', entityId: params.id,
    action: 'DELETE', changes: '', createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
