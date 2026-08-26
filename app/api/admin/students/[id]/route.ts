import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateRowByKey } from '@/lib/sheets';
import { isAdminRole } from '@/lib/roles';
import { isValidWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// PATCH — edit any student field (name, branch, class, section, parent details, etc.)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['name', 'studentCode', 'branch', 'class', 'section', 'dateOfBirth', 'parentName', 'parentEmail', 'parentPhone', 'admissionDate', 'status'];
  const patch: Record<string, any> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  if ('parentName' in patch && !patch.parentName?.trim())
    return NextResponse.json({ error: 'Parent Name cannot be empty.' }, { status: 400 });
  if ('parentPhone' in patch && !isValidWhatsAppNumber(patch.parentPhone))
    return NextResponse.json({ error: 'A valid Parent WhatsApp Number is required (10-digit mobile number).' }, { status: 400 });

  const ok = await updateRowByKey('Students', 'id', params.id, patch);
  if (!ok) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE — soft delete (sets status to Inactive, recoverable via Edit)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await updateRowByKey('Students', 'id', params.id, { status: 'Inactive' });
  if (!ok) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
