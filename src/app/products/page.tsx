'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Row = {
  id: number;
  sku: string | null;
  name: string;
  category_id: number | null;
  stock_qty: number;
  reorder_level: number;
  price_eur: number;
  cost_eur: number;
  active: boolean;
};

type Role = 'admin' | 'desk';

const fmtEur = (v:number)=> v.toLocaleString('it-IT',{ style:'currency', currency:'EUR' });

export default function ProductsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [role, setRole] = useState<Role>('desk');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // auth
      const { data: au } = await supabase.auth.getUser();
      if (!au?.user) { router.replace('/login'); return; }

      // ruolo
      const { data: r } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', au.user.id)
        .maybeSingle();
      if (r?.role === 'admin') setRole('admin');

      // dati lista (vista con giacenze)
      const { data, error } = await supabase
        .from('v_product_stock')
        .select('*')
        .order('name');
      if (!error && data) setRows(data as any);

      setLoading(false);
    })();
  }, [router]);

  if (loading) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prodotti & giacenze</h1>
        <div className="space-x-2">
          {role === 'admin' && (
            <a href="/products/new" className="rounded-2xl px-3 py-2 border hover:shadow">
              ➕ Nuovo prodotto
            </a>
          )}
          <a href="/dashboard" className="rounded-2xl px-3 py-2 border hover:shadow">← Dashboard</a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Prodotto</th>
              <th className="text-left p-2 border">SKU</th>
              <th className="text-right p-2 border">Giacenza</th>
              <th className="text-right p-2 border">Soglia</th>
              <th className="text-right p-2 border">Prezzo</th>
              <th className="p-2 border">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const low = Number(r.stock_qty) <= r.reorder_level;
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-2 border">
                    {r.name} {!r.active && <span className="text-xs ml-1 text-gray-500">(disattivo)</span>}
                  </td>
                  <td className="p-2 border">{r.sku ?? '—'}</td>
                  <td className="p-2 border text-right">
                    {Number(r.stock_qty)} {low && <span className="ml-2">🔔</span>}
                  </td>
                  <td className="p-2 border text-right">{r.reorder_level}</td>
                  <td className="p-2 border text-right">{fmtEur(r.price_eur)}</td>
                  <td className="p-2 border text-center">
                    <a className="underline" href={`/movements/new?product=${r.id}`}>Movimento</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}