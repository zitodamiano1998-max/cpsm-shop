'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { StockView } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function LowStock() {
  const router = useRouter();
  const [rows, setRows] = useState<StockView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{(async()=>{
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) { router.replace('/login'); return; }
    const { data } = await supabase.from('v_low_stock').select('*').order('name');
    setRows((data ?? []) as any);
    setLoading(false);
  })();},[router]);

  if (loading) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prodotti sottoscorta</h1>
        <a href="/dashboard" className="rounded-2xl px-3 py-2 border hover:shadow">← Dashboard</a>
      </div>

      {rows.length === 0 ? (
        <p>🎉 Nessun prodotto sottoscorta</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(r=>(
            <li key={r.id} className="border rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-gray-600">
                  Giacenza {Number(r.stock_qty)} — Soglia {r.reorder_level}
                </div>
              </div>
              <a className="underline" href={`/movements/new?product=${r.id}`}>Rifornisci</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}