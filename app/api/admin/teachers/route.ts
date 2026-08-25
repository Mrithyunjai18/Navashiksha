import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { appendRow, readTab, updateRowByKey, newId } from '@/lib/sheets';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teachers = await readTab<any>('Teachers');
  // never leak password hashes to the client
  const safe = teachers.map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, password, name, role, branch, assignedClass, assignedSection } = body;

  if (!email || !password || !name || !role)
    return NextResponse.json({ error: 'Email, password, name and role are required.' }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  if (role === 'TEACHER' && (!branch || !assignedClass || !assignedSection))
    return NextResponse.json({ error: 'Branch, class and section are required for teachers.' }, { status: 400 });

  const existing = await readTab<any>('Teachers');
  const dup = existing.find((t) => t.email?.toLowerCase() === email.toLowerCase());
  if (dup) return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const id = newId('T');

  await appendRow('Teachers', {
    id, email: email.trim(), passwordHash, name: name.trim(), role: role.toUpperCase(),
    branch: branch || '', assignedClass: assignedClass || '', assignedSection: assignedSection || '', isActive: 'true',
  });

  return NextResponse.json({ id, email }, { status: 201 });
}
