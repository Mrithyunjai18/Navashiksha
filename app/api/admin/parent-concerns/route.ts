import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, appendRow } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await readTab<any>('ParentConcerns');
  return NextResponse.json(rows);
}

// POST — add a brand new concern card
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, signs, normalByAge, schoolSupports, homeTips, linkedFocusAreas } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

  const existing = await readTab<any>('ParentConcerns');
  const code = title.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (existing.some((c) => c.code === code)) return NextResponse.json({ error: 'A concern with a similar title already exists.' }, { status: 409 });

  await appendRow('ParentConcerns', {
    code, title: title.trim(),
    signs: signs || '', normalByAge: normalByAge || '',
    schoolSupports: schoolSupports || '', homeTips: homeTips || '', linkedFocusAreas: linkedFocusAreas || '',
  });

  return NextResponse.json({ code }, { status: 201 });
}
