'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);
  useEffect(() => { if (session?.user?.email) setNewEmail(session.user.email); }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }

    setSaving(true);
    const res = await fetch('/api/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newEmail: newEmail !== session?.user?.email ? newEmail : undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setMessage({ type: 'err', text: data.error }); return; }

    setMessage({ type: 'ok', text: 'Updated successfully. Please log in again with your new details.' });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => signOut({ callbackUrl: '/login' }), 1800);
  }

  return (
    <main className="min-h-screen bg-ns-cream p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold text-ns-purple mb-1">My Account</h1>
        <p className="text-sm text-gray-500 mb-6">Update your login email or password.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-sm p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Login Email</label>
            <input type="email" className="w-full border rounded-lg p-2 text-sm" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password (leave blank to keep current)</label>
            <input type="password" className="w-full border rounded-lg p-2 text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min. 6 characters" />
          </div>

          {newPassword && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
              <input type="password" className="w-full border rounded-lg p-2 text-sm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          )}

          <div className="pt-2 border-t">
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password (required to confirm changes)</label>
            <input type="password" className="w-full border rounded-lg p-2 text-sm" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>

          {message && <p className={`text-sm ${message.type === 'err' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}

          <button disabled={saving} className="w-full py-2.5 rounded-xl2 bg-ns-purple text-white font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  );
}
