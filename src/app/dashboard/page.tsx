'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<'admin'|'desk'|'unknown'>('unknown');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email ?? '');
      const { data, error } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) setRole('desk'); else setRole(data.role as any);
    })();
  }, [router]);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          className="rounded-2xl px-4 py-2 border"
          onClick={async ()=>{
            await supabase.auth.signOut();
            router.push('/login');
          }}
        >
          Esci
        </button>
      </div>

      <div className="border rounded-2xl p-4">
        <p><b>Utente:</b> {email}</p>
        <p><b>Ruolo:</b> {role}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="/products" className="border rounded-2xl p-4 hover:shadow">📦 Prodotti & giacenze</a>
        <a href="/movements/new" className="border rounded-2xl p-4 hover:shadow">➕ Movimento (vendita/carico)</a>
        <a href="/low-stock" className="border rounded-2xl p-4 hover:shadow">🔔 Sottoscorta</a>
        <a href="/reports" className="border rounded-2xl p-4 hover:shadow">📊 Report</a>
      </div>

      {role === 'desk' && (
        <div className="text-sm text-gray-600">
          Nota: come <b>desk</b> puoi registrare solo vendite (OUT). I carichi (IN) sono riservati agli <b>admin</b>.
        </div>
      )}
    </main>
  );
}