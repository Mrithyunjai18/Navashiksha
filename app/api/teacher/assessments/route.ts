import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab, findRowByKey } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const all = await readTab<any>('Assessments');
  const mine = all.filter((a) => a.isDeleted !== 'true' && a.createdBy?.toLowerCase() === session.user!.email!.toLowerCase());
  mine.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const students = await readTab<any>('Students');
  const withNames = mine.map((a) => {
    const student = students.find((s) => s.id === a.studentId);
    return { ...a, studentName: student?.name || 'Unknown' };
  });

  return NextResponse.json(withNames);
}
