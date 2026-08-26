'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from '@/lib/whatsapp';

export default function ShareToWhatsAppButton({
  targetId, parentName, parentPhone, studentName, reportUrl, fileName,
}: {
  targetId: string; parentName: string; parentPhone: string; studentName: string; reportUrl: string; fileName: string;
}) {
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const valid = isValidWhatsAppNumber(parentPhone);

  // Staff-only — this sends the report TO the parent, so it shouldn't appear
  // when the parent themselves opens the shared report link with no session.
  if (!session?.user) return null;

  const message = `Hi ${parentName || 'there'},\nPlease find the weekly report of your child ${studentName} from Navashiksha Play School.\n📄 Weekly Report: ${reportUrl}\nThank you for your continued support. 💛\nRegards,\nNavashiksha Play School`;

  async function handleClick() {
    if (!valid) return;
    setBusy(true);

    const html2canvas = (await import('html2canvas')).default;
    const el = document.getElementById(targetId);
    const canvas = el ? await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true }) : null;
    const blob: Blob | null = canvas ? await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png')) : null;

    setBusy(false);

    // Mobile with native share support (Android Chrome, iOS Safari): share the actual
    // report image + message — the person picks WhatsApp from their share sheet.
    if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], `${fileName}.png`, { type: 'image/png' })] })) {
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
      try {
        await navigator.share({ files: [file], text: message, title: 'Navashiksha Weekly Report' });
        return;
      } catch {
        return; // user cancelled the native share sheet
      }
    }

    // Desktop / no native file-share support: WhatsApp Web can't accept a pre-attached
    // image via URL, so download the image and open WhatsApp with the text pre-filled —
    // the admin then drags the downloaded image into the chat manually.
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.png`; a.click();
      URL.revokeObjectURL(url);
    }
    const normalized = normalizeWhatsAppNumber(parentPhone);
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, '_blank');
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
