import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { appendRow, readTab, newId } from '@/lib/sheets';
import { isAdminRole } from '@/lib/roles';
import { isValidWhatsAppNumber } from '@/lib/whatsapp';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const students = await readTab<any>('Students');
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.branch || !body.class || !body.section)
    return NextResponse.json({ error: 'Name, branch, class and section are required.' }, { status: 400 });
  if (!body.parentName?.trim())
    return NextResponse.json({ error: 'Parent Name is required.' }, { status: 400 });
  if (!body.parentPhone?.trim() || !isValidWhatsAppNumber(body.parentPhone))
    return NextResponse.json({ error: 'A valid Parent WhatsApp Number is required (10-digit mobile number).' }, { status: 400 });

  const existing = await readTab<any>('Students');
  const nextNum = existing.length + 1;
  const studentCode = body.studentCode?.trim() || `NS-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

  if (existing.some((s) => s.studentCode === studentCode))
    return NextResponse.json({ error: `Student code ${studentCode} already exists.` }, { status: 409 });

  const id = newId('ST');
  await appendRow('Students', {
    id, studentCode, name: body.name.trim(),
    nameVariants: '', branch: body.branch.trim(), class: body.class.trim(), section: body.section.trim(),
    dateOfBirth: body.dateOfBirth || '', parentName: body.parentName || '', parentEmail: body.parentEmail || '',
    parentPhone: body.parentPhone || '', admissionDate: body.admissionDate || new Date().toISOString().slice(0, 10),
    status: 'Active',
  });

  return NextResponse.json({ id, studentCode }, { status: 201 });
}
