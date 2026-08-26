import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateRowByKey, deleteRowByKey } from '@/lib/sheets';
import { isAdminRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, any> = {};
  for (const key of ['title', 'signs', 'normalByAge', 'schoolSupports', 'homeTips', 'linkedFocusAreas']) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const ok = await updateRowByKey('ParentConcerns', 'code', params.code, patch);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await deleteRowByKey('ParentConcerns', 'code', params.code);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
