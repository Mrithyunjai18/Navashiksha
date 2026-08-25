'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError('Incorrect email or password.'); return; }
    router.push('/redirect');
  }

  return (
    <main className="min-h-screen bg-ns-yellow flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-lg p-6 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-ns-purple text-center mb-1">NAVASHIKSHA</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Weekly Assessment Portal</p>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input className="w-full border rounded-lg p-2 mb-3" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoFocus />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input className="w-full border rounded-lg p-2 mb-4" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button disabled={loading} className="w-full py-2.5 rounded-xl2 bg-ns-purple text-white font-semibold">
          {loading ? 'Signing in…' : 'Log In'}
        </button>
        <p className="text-xs text-gray-400 mt-4 text-center">Ask your Admin if you don't have login credentials yet.</p>
      </form>
    </main>
  );
}
