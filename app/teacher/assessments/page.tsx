'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyAssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  useEffect(() => {
    fetch('/api/teacher/assessments').then((r) => r.json()).then(setAssessments);
  }, []);

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-ns-purple">My Assessments</h1>
          <Link href="/teacher/assessment" className="text-ns-blue text-sm">+ New Assessment</Link>
        </div>

        <div className="bg-white rounded-xl2 shadow-sm p-5">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="py-1">Student</th><th>Week</th><th>Attendance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-1">{a.studentName}</td>
                  <td>{a.weekStartDate}</td>
                  <td>{a.daysPresent}/{a.workingDays} ({a.attendancePct}%)</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'SUBMITTED' ? 'bg-ns-green/20 text-ns-green' : 'bg-gray-200 text-gray-600'}`}>{a.status}</span></td>
                  <td className="space-x-2">
                    <Link className="text-ns-blue" href={`/teacher/assessments/${a.id}/edit`}>Edit</Link>
                    <Link className="text-ns-blue" href={`/report/${a.id}`}>Report</Link>
                  </td>
                </tr>
              ))}
              {assessments.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-6">No assessments submitted yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
