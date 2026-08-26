import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, appendRow } from '@/lib/sheets';
import { isAdminRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await readTab<{ listName: string; label: string; sortOrder: string }>('MasterLists');
  const branches = rows.filter((r) => r.listName === 'Branches').sort((a, b) => +a.sortOrder - +b.sortOrder).map((r) => r.label);
  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: 'Branch name is required.' }, { status: 400 });

  const rows = await readTab<{ listName: string; label: string }>('MasterLists');
  const branches = rows.filter((r) => r.listName === 'Branches');
  if (branches.some((b) => b.label.toLowerCase() === label.trim().toLowerCase()))
    return NextResponse.json({ error: 'This branch already exists.' }, { status: 409 });

  await appendRow('MasterLists', { listName: 'Branches', label: label.trim(), sortOrder: String(branches.length) });
  return NextResponse.json({ ok: true, label: label.trim() }, { status: 201 });
}
