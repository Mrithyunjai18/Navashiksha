import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { readTab } from '@/lib/sheets';
import Link from 'next/link';
import { isAdminRole } from '@/lib/roles';
import AssessmentsTable from '@/components/AssessmentsTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as any).role)) redirect('/login');

  const [students, assessments, teachers] = await Promise.all([
    readTab<any>('Students'), readTab<any>('Assessments'), readTab<any>('Teachers'),
  ]);

  const activeAssessments = assessments.filter((a) => a.isDeleted !== 'true');
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = activeAssessments.filter((a) => a.status === 'SUBMITTED' && new Date(a.weekStartDate) >= weekAgo);
  const drafts = activeAssessments.filter((a) => a.status === 'DRAFT');
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const cards = [
    ['Total Students', students.filter((s) => s.status !== 'Inactive').length],
    ['Active Teachers', teachers.filter((t) => t.isActive !== 'false').length],
    ['Assessments This Week', thisWeek.length],
    ['Pending Drafts', drafts.length],
  ] as const;

  const recent = activeAssessments
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 300) // reasonable cap for one school's data; adjust if needed
    .map((a) => {
      const student = studentMap[a.studentId];
      return {
        id: a.id,
        studentName: student?.name ?? a.studentId,
        class: student?.class ?? '', section: student?.section ?? '', branch: student?.branch ?? '',
        weekStartDate: a.weekStartDate, createdBy: a.createdBy,
        daysPresent: Number(a.daysPresent) || 0, workingDays: Number(a.workingDays) || 0, attendancePct: Number(a.attendancePct) || 0,
        status: a.status,
      };
    });

  return (
    <main className="p-6 bg-ns-cream min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-ns-purple">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/account" className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm">My Account</Link>
          <Link href="/admin/students" className="px-3 py-1.5 rounded-lg bg-ns-purple text-white text-sm font-semibold">+ Add / View Students</Link>
          <Link href="/admin/teachers" className="px-3 py-1.5 rounded-lg border border-ns-purple text-ns-purple text-sm font-semibold">+ Add / View Teachers</Link>
          <Link href="/admin/progress-report" className="px-3 py-1.5 rounded-lg border border-ns-purple text-ns-purple text-sm font-semibold">📊 Progress Report</Link>
          <Link href="/admin/questions" className="px-3 py-1.5 rounded-lg border border-ns-purple text-ns-purple text-sm font-semibold">📝 Custom Questions</Link>
          <Link href="/admin/weekly-digest" className="px-3 py-1.5 rounded-lg border border-ns-purple text-ns-purple text-sm font-semibold">📦 Weekly Digest</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl2 shadow-sm p-4 border border-ns-yellow/50">
            <p className="text-3xl font-extrabold text-ns-purple">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl2 shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">Recent Weekly Assessments</h2>
          <span className="text-xs text-gray-400">Data lives in your Google Sheet — edit rows there directly if needed.</span>
        </div>
        <AssessmentsTable rows={recent} />
      </div>
    </main>
  );
}
