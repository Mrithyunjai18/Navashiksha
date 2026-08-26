'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from '@/lib/whatsapp';

export default function ShareToWhatsAppButton({
  targetId, parentName, parentPhone, studentName, studentClass, reportUrl, fileName, instagramHandle = 'navashikshaplayschoolhsr',
}: {
  targetId: string; parentName: string; parentPhone: string; studentName: string; studentClass?: string; reportUrl: string; fileName: string; instagramHandle?: string;
}) {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const valid = isValidWhatsAppNumber(parentPhone);

  // Staff-only — this sends the report TO the parent, so it shouldn't appear
  // when the parent themselves opens the shared report link with no session.
  if (!session?.user) return null;

  const studentLabel = studentClass ? `${studentName} (${studentClass})` : studentName;
  const message = `Hi ${parentName || 'there'},\nPlease find the weekly report of your child ${studentLabel} from Navashiksha Play School.\n📄 Weekly Report: ${reportUrl}\nThank you for your continued support. 💛\nFor more updates, follow us on Instagram: instagram.com/${instagramHandle}\nRegards,\nNavashiksha Play School`;

  async function handleClick() {
    if (!valid) return;

    // Open the tab synchronously, immediately on click — browsers block window.open()
    // calls that happen after an await (like the screenshot capture below), treating
    // them as unrequested popups. Opening a blank tab first, then pointing it at the
    // right URL once ready, avoids that block entirely.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const waTab = isMobile ? null : window.open('about:blank', '_blank');

    setBusy(true);

    const html2canvas = (await import('html2canvas')).default;
    const el = document.getElementById(targetId);
    const canvas = el ? await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true }) : null;
    const blob: Blob | null = canvas ? await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png')) : null;

    setBusy(false);

    // Only use the native OS share sheet on actual mobile devices — desktop Safari/macOS
    // also implements the Web Share API, but its share sheet only lists installed Mac
    // apps (AirDrop, Mail, Messages...), never WhatsApp Web, so it's useless there.
    if (isMobile && blob && navigator.share && navigator.canShare?.({ files: [new File([blob], `${fileName}.png`, { type: 'image/png' })] })) {
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
      try {
        await navigator.share({ files: [file], text: message, title: 'Navashiksha Weekly Report' });
        return;
      } catch {
        return; // user cancelled the native share sheet
      }
    }

    // Desktop (any browser): WhatsApp Web can't accept a pre-attached image via URL,
    // so download the image and open WhatsApp Web with the text pre-filled —
    // the admin then drags the downloaded image into the chat manually.
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.png`; a.click();
      URL.revokeObjectURL(url);
    }
    const normalized = normalizeWhatsAppNumber(parentPhone);
    const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    if (waTab) waTab.location.href = waUrl;
    else window.open(waUrl, '_blank'); // fallback if the pre-open didn't work for some reason
  }

  if (!valid) {
    return (
      <span
        title="No valid WhatsApp number on file for this student's parent — add one in Student Details"
        className="flex-1 text-center py-2 rounded-xl2 bg-gray-100 text-gray-400 font-semibold cursor-not-allowed select-none"
      >
        💬 Share to WhatsApp
      </span>
    );
  }

  return (
    <button
      onClick={handleClick} disabled={busy}
      className="flex-1 py-2 rounded-xl2 bg-[#25D366] text-white font-semibold disabled:opacity-50"
    >
      {busy ? 'Preparing…' : '💬 Share to WhatsApp'}
    </button>
  );
}
