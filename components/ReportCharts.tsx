'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const NS_PURPLE = '#5B2A86';
const NS_PINK = '#EC4899';
const NS_GREEN = '#22C55E';

export function AttendanceTrendChart({ data }: { data: { week: string; pct: number }[] }) {
  const chartData = data.map((d) => ({ week: new Date(d.week).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), pct: d.pct }));
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #eee' }} />
          <Line type="monotone" dataKey="pct" stroke={NS_PURPLE} strokeWidth={2.5} dot={{ r: 3, fill: NS_PURPLE }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const LEVEL_SCORE: Record<string, number> = { NEEDS_SUPPORT: 25, DEVELOPING: 50, GOOD: 75, EXCELLENT: 100 };
const LEVEL_COLOR: Record<string, string> = { NEEDS_SUPPORT: '#F97316', DEVELOPING: '#EAB308', GOOD: '#22C55E', EXCELLENT: '#10B981' };

/** Simple horizontal progress bar for a single skill area, driven by its latest known level. */
export function SkillBar({ label, level }: { label: string; level?: string }) {
  const pct = level ? LEVEL_SCORE[level] ?? 0 : 0;
  const color = level ? LEVEL_COLOR[level] ?? '#ccc' : '#e5e5e5';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-400">{level ? level.replace('_', ' ') : '—'}</span>
      </div>
      {/* Single-element gradient bar instead of a nested clipped fill div —
          html2canvas (used for the downloadable/shareable image) sometimes
          misaligns nested overflow-hidden + rounded-full fills, but renders
          a plain background-gradient correctly every time. */}
      <div
        className="h-2 w-full rounded-full"
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, #f3f4f6 ${pct}%)` }}
      />
    </div>
  );
}

/** Circular attendance gauge for the weekly report header. */
export function AttendanceRing({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct >= 90 ? NS_GREEN : pct >= 75 ? '#EAB308' : '#F97316';
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#eee" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}
