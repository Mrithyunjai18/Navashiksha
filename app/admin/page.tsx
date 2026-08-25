import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { readTab } from '@/lib/sheets';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/login');

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

  const recent = activeAssessments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 25);

  return (
    <main className="p-6 bg-ns-cream min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-ns-purple">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/students" className="px-3 py-1.5 rounded-lg bg-ns-purple text-white text-sm font-semibold">+ Add / View Students</Link>
          <Link href="/admin/teachers" className="px-3 py-1.5 rounded-lg border border-ns-purple text-ns-purple text-sm font-semibold">+ Add / View Teachers</Link>
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
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="py-2">Student</th><th>Week</th><th>Teacher</th><th>Attendance</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {recent.map((a) => {
              const student = studentMap[a.studentId];
              return (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{student?.name ?? a.studentId}</td>
                  <td>{a.weekStartDate}</td>
                  <td>{a.createdBy}</td>
                  <td>{a.daysPresent}/{a.workingDays} ({a.attendancePct}%)</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'SUBMITTED' ? 'bg-ns-green/20 text-ns-green' : 'bg-gray-200 text-gray-600'}`}>{a.status}</span></td>
                  <td><Link className="text-ns-blue" href={`/report/${a.id}`}>Report</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
