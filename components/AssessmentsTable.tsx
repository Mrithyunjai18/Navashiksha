'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

interface Row {
  id: string; studentName: string; class: string; section: string; branch: string;
  weekStartDate: string; createdBy: string; daysPresent: number; workingDays: number; attendancePct: number; status: string;
}

type SortKey = 'studentName' | 'weekStartDate' | 'createdBy' | 'attendancePct' | 'status';

export default function AssessmentsTable({ rows }: { rows: Row[] }) {
  const [branchFilter, setBranchFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('weekStartDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const branches = useMemo(() => Array.from(new Set(rows.map((r) => r.branch).filter(Boolean))).sort(), [rows]);
  const classes = useMemo(() => Array.from(new Set(rows.filter((r) => !branchFilter || r.branch === branchFilter).map((r) => r.class).filter(Boolean))).sort(), [rows, branchFilter]);
  const sections = useMemo(() => Array.from(new Set(rows.filter((r) => (!branchFilter || r.branch === branchFilter) && (!classFilter || r.class === classFilter)).map((r) => r.section).filter(Boolean))).sort(), [rows, branchFilter, classFilter]);

  const filtered = useMemo(() => {
    let result = rows.filter((r) =>
      (!branchFilter || r.branch === branchFilter) &&
      (!classFilter || r.class === classFilter) &&
      (!sectionFilter || r.section === sectionFilter) &&
      (!statusFilter || r.status === statusFilter) &&
      (!search || r.studentName.toLowerCase().includes(search.toLowerCase()))
    );
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'attendancePct') cmp = a.attendancePct - b.attendancePct;
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [rows, branchFilter, classFilter, sectionFilter, statusFilter, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function clearFilters() {
    setBranchFilter(''); setClassFilter(''); setSectionFilter(''); setStatusFilter(''); setSearch('');
  }

  const hasFilters = branchFilter || classFilter || sectionFilter || statusFilter || search;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text" placeholder="Search student…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm w-40"
        />
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setClassFilter(''); setSectionFilter(''); }} className="border rounded-lg px-2 py-1.5 text-sm">
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); }} className="border rounded-lg px-2 py-1.5 text-sm">
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm">
          <option value="">All Sections</option>
          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="DRAFT">Draft</option>
        </select>
        {hasFilters && <button onClick={clearFilters} className="text-xs text-ns-blue px-2">Clear filters</button>}
        <span className="text-xs text-gray-400 ml-auto self-center">{filtered.length} of {rows.length} shown</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <SortableHeader label="Student" active={sortKey === 'studentName'} dir={sortDir} onClick={() => toggleSort('studentName')} />
            <th className="py-2">Class</th>
            <SortableHeader label="Week" active={sortKey === 'weekStartDate'} dir={sortDir} onClick={() => toggleSort('weekStartDate')} />
            <SortableHeader label="Teacher" active={sortKey === 'createdBy'} dir={sortDir} onClick={() => toggleSort('createdBy')} />
            <SortableHeader label="Attendance" active={sortKey === 'attendancePct'} dir={sortDir} onClick={() => toggleSort('attendancePct')} />
            <SortableHeader label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 font-medium">{r.studentName}</td>
              <td>{r.class}-{r.section}</td>
              <td>{r.weekStartDate}</td>
              <td>{r.createdBy}</td>
              <td>{r.daysPresent}/{r.workingDays} ({r.attendancePct}%)</td>
              <td><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'SUBMITTED' ? 'bg-ns-green/20 text-ns-green' : 'bg-gray-200 text-gray-600'}`}>{r.status}</span></td>
              <td className="space-x-2 whitespace-nowrap"><Link className="text-ns-blue" href={`/report/${r.id}`}>Report</Link><Link className="text-ns-purple" href={`/admin/assessments/${r.id}/edit`}>Edit</Link></td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-gray-400">No assessments match these filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <th className="py-2 cursor-pointer select-none" onClick={onClick}>
      {label} {active ? (dir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );
}
