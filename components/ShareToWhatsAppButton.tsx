import { isValidWhatsAppNumber, buildWhatsAppLink } from '@/lib/whatsapp';

export default function ShareToWhatsAppButton({
  parentName, parentPhone, studentName, reportUrl,
}: {
  parentName: string; parentPhone: string; studentName: string; reportUrl: string;
}) {
  const valid = isValidWhatsAppNumber(parentPhone);

  const message = `Hi ${parentName || 'there'},\nPlease find the weekly report of your child ${studentName} from Navashiksha Play School.\n📄 Weekly Report: ${reportUrl}\nThank you for your continued support. 💛\nRegards,\nNavashiksha Play School`;

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
    <a
      href={buildWhatsAppLink(parentPhone, message)}
      target="_blank" rel="noopener noreferrer"
      className="flex-1 text-center py-2 rounded-xl2 bg-[#25D366] text-white font-semibold"
    >
      💬 Share to WhatsApp
    </a>
  );
}
