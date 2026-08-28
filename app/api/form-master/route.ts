import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readTab } from '@/lib/sheets';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;

  const [students, masterRows, customQuestions] = await Promise.all([
    readTab<any>('Students'),
    readTab<{ listName: string; label: string; sortOrder: string }>('MasterLists'),
    readTab<any>('CustomQuestions'),
  ]);

  const visibleStudents = user.role === 'ADMIN'
    ? students.filter((s) => s.status !== 'Inactive')
    : students.filter((s) => s.status !== 'Inactive' && s.class === user.assignedClass && s.section === user.assignedSection);

  const pickList = (name: string) => masterRows.filter((m) => m.listName === name).sort((a, b) => +a.sortOrder - +b.sortOrder).map((m) => ({ id: m.label, label: m.label }));

  return NextResponse.json({
    students: visibleStudents.map((s) => ({ id: s.id, name: s.name, studentCode: s.studentCode })),
    socialAreas: pickList('SocialEmotional'),
    readinessAreas: pickList('LearningReadiness'),
    focusAreas: pickList('FocusAreas'),
    schoolActivityOptions: pickList('SchoolActivities'),
    homeActivityOptions: pickList('HomeActivities'),
    customQuestions: customQuestions.filter((q) => q.isActive !== 'false').sort((a, b) => +a.sortOrder - +b.sortOrder),
  });
}
