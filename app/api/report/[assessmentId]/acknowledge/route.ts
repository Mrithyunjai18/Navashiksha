import { NextRequest, NextResponse } from 'next/server';
import { appendRow, readTab, newId, findRowByKey } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

// GET — check if this report has already been acknowledged, and return the reply(ies).
// Public — no auth. Used by the report page to show "already seen" state, and by the
// admin dashboard/edit page to show acknowledgment status.
export async function GET(_req: NextRequest, { params }: { params: { assessmentId: string } }) {
  const assessment = await findRowByKey<any>('Assessments', 'id', params.assessmentId);
  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const all = await readTab<any>('ReportAcknowledgements');
  const mine = all.filter((r) => r.assessmentId === params.assessmentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ acknowledged: mine.length > 0, entries: mine });
}

// POST — record a parent's acknowledgment ("Seen") and optional short reply.
// Deliberately public / unauthenticated — parents never log in, they just open
// the report link. Rate-limited implicitly by requiring a real assessment id.
export async function POST(req: NextRequest, { params }: { params: { assessmentId: string } }) {
  const assessment = await findRowByKey<any>('Assessments', 'id', params.assessmentId);
  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { reply } = await req.json().catch(() => ({ reply: '' }));
  const cleanReply = (reply || '').toString().slice(0, 280); // keep replies short — this isn't a chat feature

  await appendRow('ReportAcknowledgements', {
    id: newId('RA'), assessmentId: params.assessmentId, reply: cleanReply, createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
