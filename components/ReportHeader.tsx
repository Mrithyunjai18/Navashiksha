export default function ReportHeader({ instagramHandle = 'navashikshaplayschoolhsr' }: { instagramHandle?: string }) {
  return (
    <div className="bg-ns-yellow p-5 text-center">
      <p className="text-xs tracking-widest text-ns-pink font-bold">✳ SINCE 2012 ✳</p>
      <h1 className="text-3xl font-extrabold text-ns-purple tracking-wide">NAVASHIKSHA</h1>
      <p className="text-sm font-bold text-emerald-600">PRESCHOOL • PLAYSCHOOL • DAYCARE</p>
      <div className="flex justify-center gap-3 mt-3 text-xs font-bold flex-wrap">
        <span className="bg-white rounded-full px-3 py-1 text-ns-pink">🎨 MONTEPLAY</span>
        <span className="bg-white rounded-full px-3 py-1 text-ns-green">🌱 PLAYWAY</span>
        <span className="bg-white rounded-full px-3 py-1 text-ns-blue">⭐ HOLISTIC GROWTH</span>
      </div>
      <a
        href={`https://instagram.com/${instagramHandle}`}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-ns-purple no-underline"
      >
        📸 @{instagramHandle}
      </a>
    </div>
  );
}
