'use client';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-ns-yellow flex items-center justify-center p-4">
      <div className="bg-white rounded-xl2 shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-extrabold text-ns-purple mb-1">NAVASHIKSHA</h1>
        <p className="text-sm text-gray-500 mb-6">Weekly Assessment Portal</p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/redirect' })}
          className="w-full py-3 rounded-xl2 border border-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
          Sign in with Google
        </button>
        <p className="text-xs text-gray-400 mt-4">Only email addresses added by Admin in the Teachers sheet can log in.</p>
      </div>
    </main>
  );
}
