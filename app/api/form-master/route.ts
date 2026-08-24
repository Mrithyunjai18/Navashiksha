import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readTab } from '@/lib/sheets';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  const [students, concernRows, masterRows] = await Promise.all([
    readTab<any>('Students'),
    readTab<any>('ParentConcerns'),
    readTab<{ listName: string; label: string; sortOrder: string }>('MasterLists'),
  ]);

  const visibleStudents = user.role === 'ADMIN'
    ? students.filter((s) => s.status !== 'Inactive')
    : students.filter((s) => s.status !== 'Inactive' && s.class === user.assignedClass && s.section === user.assignedSection);

  const concerns = concernRows.map((c) => ({
    id: c.code, code: c.code, title: c.title,
    signs: (c.signs || '').split('|').filter(Boolean).map((label: string) => ({ id: label, label })),
    schoolSupports: (c.schoolSupports || '').split('|').filter(Boolean).map((label: string) => ({ id: label, label })),
    homeTips: (c.homeTips || '').split('|').filter(Boolean).map((label: string) => ({ id: label, label })),
    linkedFocusAreas: (c.linkedFocusAreas || '').split('|').filter(Boolean).map((label: string) => ({ id: label, label })),
    linkedLearningReadiness: [],
  }));

  const pickList = (name: string) => masterRows.filter((m) => m.listName === name).sort((a, b) => +a.sortOrder - +b.sortOrder).map((m) => ({ id: m.label, label: m.label }));

  return NextResponse.json({
    students: visibleStudents.map((s) => ({ id: s.id, name: s.name, studentCode: s.studentCode })),
    concerns,
    socialAreas: pickList('SocialEmotional'),
    readinessAreas: pickList('LearningReadiness'),
    focusAreas: pickList('FocusAreas'),
    schoolActivityOptions: pickList('SchoolActivities'),
    homeActivityOptions: pickList('HomeActivities'),
  });
}
