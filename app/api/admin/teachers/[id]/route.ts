import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, updateRowByKey } from '@/lib/sheets';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { newEmail, newPassword, isActive } = await req.json();
  if (newPassword && newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

  const teachers = await readTab<any>('Teachers');
  const target = teachers.find((t) => t.id === params.id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (newEmail && newEmail.toLowerCase() !== target.email.toLowerCase()) {
    const clash = teachers.find((t) => t.email?.toLowerCase() === newEmail.toLowerCase() && t.id !== params.id);
    if (clash) return NextResponse.json({ error: 'That email is already in use by another account.' }, { status: 409 });
  }

  const patch: Record<string, any> = {};
  if (newEmail) patch.email = newEmail.trim();
  if (newPassword) patch.passwordHash = await bcrypt.hash(newPassword, 10);
  if (typeof isActive === 'boolean') patch.isActive = String(isActive);

  const ok = await updateRowByKey('Teachers', 'id', params.id, patch);
  if (!ok) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
