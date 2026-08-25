'use client';
import { useState } from 'react';

export default function ReportShareBar({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [busy, setBusy] = useState(false);

  async function captureImage(): Promise<Blob | null> {
    const html2canvas = (await import('html2canvas')).default;
    const el = document.getElementById(targetId);
    if (!el) return null;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  }

  async function handleDownload() {
    setBusy(true);
    const blob = await captureImage();
    setBusy(false);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}.png`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    setBusy(true);
    const blob = await captureImage();
    setBusy(false);
    if (!blob) return;
    const file = new File([blob], `${fileName}.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Navashiksha Weekly Report', text: 'Weekly Learning & Development Report' });
      } catch {
        // user cancelled — no-op
      }
    } else {
      // fallback: no native share support (e.g. desktop browser) — just download instead
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.png`; a.click();
      URL.revokeObjectURL(url);
      alert('Sharing isn\'t supported on this browser/device — the image was downloaded instead. You can attach it manually to WhatsApp or email.');
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-4 flex gap-2 print:hidden">
      <button onClick={handleDownload} disabled={busy} className="flex-1 py-2 rounded-xl2 border border-ns-purple text-ns-purple font-semibold disabled:opacity-50">
        {busy ? 'Preparing…' : 'Download Image'}
      </button>
      <button onClick={handleShare} disabled={busy} className="flex-1 py-2 rounded-xl2 bg-ns-purple text-white font-semibold disabled:opacity-50">
        {busy ? 'Preparing…' : '📤 Share'}
      </button>
    </div>
  );
}
