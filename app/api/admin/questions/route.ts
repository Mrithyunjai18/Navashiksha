import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, appendRow, newId } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

// GET — returns ALL questions (including inactive) for the admin management list.
// The teacher-facing form gets its filtered/active-only list via /api/form-master instead.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await readTab<any>('CustomQuestions');
  const sorted = rows.sort((a, b) => +a.sortOrder - +b.sortOrder);
  return NextResponse.json(sorted);
}

// POST — admin only, create a new question
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label, type, options, points } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: 'Question label is required.' }, { status: 400 });
  if (!['text', 'textarea', 'single_select', 'multi_select'].includes(type))
    return NextResponse.json({ error: 'Invalid question type.' }, { status: 400 });
  if ((type === 'single_select' || type === 'multi_select') && !options?.trim())
    return NextResponse.json({ error: 'Options are required for select-type questions.' }, { status: 400 });

  const existing = await readTab<any>('CustomQuestions');
  const id = newId('Q');

  await appendRow('CustomQuestions', {
    id, label: label.trim(), type, options: options?.trim() || '',
    points: points !== undefined && points !== '' ? String(points) : '',
    sortOrder: String(existing.length), isActive: 'true',
  });

  return NextResponse.json({ id }, { status: 201 });
}
