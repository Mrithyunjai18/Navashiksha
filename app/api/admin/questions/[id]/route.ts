import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateRowByKey, deleteRowByKey } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if ((body.type === 'single_select' || body.type === 'multi_select') && body.options !== undefined && !body.options.trim())
    return NextResponse.json({ error: 'Options are required for select-type questions.' }, { status: 400 });

  const patch: Record<string, any> = {};
  if ('isActive' in body) patch.isActive = String(body.isActive);
  if ('label' in body) patch.label = body.label.trim();
  if ('type' in body) patch.type = body.type;
  if ('options' in body) patch.options = body.options?.trim() || '';
  if ('points' in body) patch.points = body.points !== '' && body.points !== undefined ? String(body.points) : '';
  if ('parentQuestionId' in body) patch.parentQuestionId = body.parentQuestionId || '';
  if ('triggerOption' in body) patch.triggerOption = body.triggerOption || '';

  const ok = await updateRowByKey('CustomQuestions', 'id', params.id, patch);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE — permanently removes the question. Past answers to it stay in CustomAnswers
// (historical reports keep their data), but it's gone from the form and the admin list.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await deleteRowByKey('CustomQuestions', 'id', params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
