'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={signIn} className="w-full max-w-sm space-y-4 border rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-semibold">Accedi</h1>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email" required value={email}
            onChange={e=>setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password" required value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl px-4 py-2 bg-black text-white"
        >
          {loading ? 'Accesso…' : 'Entra'}
        </button>
      </form>
    </main>
  );
}