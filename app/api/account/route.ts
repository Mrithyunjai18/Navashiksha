import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, updateRowByKey } from '@/lib/sheets';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newEmail, newPassword } = await req.json();
  if (!currentPassword) return NextResponse.json({ error: 'Current password is required to make changes.' }, { status: 400 });
  if (!newEmail && !newPassword) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  if (newPassword && newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });

  const teachers = await readTab<any>('Teachers');
  const me = teachers.find((t) => t.email?.toLowerCase() === session.user!.email!.toLowerCase());
  if (!me) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, me.passwordHash || '');
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });

  if (newEmail && newEmail.toLowerCase() !== me.email.toLowerCase()) {
    const clash = teachers.find((t) => t.email?.toLowerCase() === newEmail.toLowerCase());
    if (clash) return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 });
  }

  const patch: Record<string, any> = {};
  if (newEmail) patch.email = newEmail.trim();
  if (newPassword) patch.passwordHash = await bcrypt.hash(newPassword, 10);

  const ok = await updateRowByKey('Teachers', 'id', me.id, patch);
  if (!ok) return NextResponse.json({ error: 'Update failed — please try again.' }, { status: 500 });

  return NextResponse.json({ ok: true, emailChanged: !!newEmail });
}
