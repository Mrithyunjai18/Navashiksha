import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, appendRow, updateRowByKey, newId } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

// GET — anyone logged in (teacher needs these to render the form)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await readTab<any>('CustomQuestions');
  const active = rows.filter((q) => q.isActive !== 'false').sort((a, b) => +a.sortOrder - +b.sortOrder);
  return NextResponse.json(active);
}

// POST — admin only, create a new question
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label, type, options } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: 'Question label is required.' }, { status: 400 });
  if (!['text', 'textarea', 'single_select', 'multi_select'].includes(type))
    return NextResponse.json({ error: 'Invalid question type.' }, { status: 400 });
  if ((type === 'single_select' || type === 'multi_select') && !options?.trim())
    return NextResponse.json({ error: 'Options are required for select-type questions.' }, { status: 400 });

  const existing = await readTab<any>('CustomQuestions');
  const id = newId('Q');

  await appendRow('CustomQuestions', {
    id, label: label.trim(), type, options: options?.trim() || '',
    sortOrder: String(existing.length), isActive: 'true',
  });

  return NextResponse.json({ id }, { status: 201 });
}
