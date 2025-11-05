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
  const [showInactive, setShowInactive] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [lowCount, setLowCount] = useState(0);

  async function load() {
    setLoading(true); setErr(null);

    // Auth
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) { router.replace('/login'); return; }

    // Ruolo
    const { data: r } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', au.user.id)
      .maybeSingle();
    if (r?.role === 'admin') setRole('admin');

    // Prodotti & giacenze (vista)
    const { data, error } = await supabase
      .from('v_product_stock')
      .select('*')
      .order('name');

    if (error) setErr(error.message);
    setRows((data ?? []) as any);

    // Conteggio alert sottoscorta aperti
    const lowRes = await supabase
      .from('low_stock_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');

    setLowCount(lowRes.count ?? 0);

    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [router]);

  const visible = rows.filter(r => showInactive ? true : r.active);

  const deactivate = async (id:number) => {
    setErr(null);
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
    if (error) { setErr(error.message); return; }
    await load();
  };

  const reactivate = async (id:number) => {
    setErr(null);
    const { error } = await supabase.from('products').update({ active: true }).eq('id', id);
    if (error) { setErr(error.message); return; }
    await load();
  };

  if (loading) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Prodotti & giacenze</h1>
        <div className="flex items-center gap-2">
          <a href="/low-stock" className="rounded-2xl px-3 py-2 border hover:shadow">
            🔔 Sottoscorta{lowCount > 0 && <span className="ml-1 font-semibold">({lowCount})</span>}
          </a>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e=>setShowInactive(e.target.checked)}
            />
            Mostra disattivi
          </label>
          {role === 'admin' && (
            <a href="/products/new" className="rounded-2xl px-3 py-2 border hover:shadow">
              ➕ Nuovo prodotto
            </a>
          )}
          <a href="/dashboard" className="rounded-2xl px-3 py-2 border hover:shadow">← Dashboard</a>
        </div>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-[850px] w-full border">
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
            {visible.map(r => {
              const low = Number(r.stock_qty) <= r.reorder_level;
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-2 border">
                    {r.name}{' '}
                    {!r.active && <span className="text-xs ml-1 text-gray-500">(disattivo)</span>}
                  </td>
                  <td className="p-2 border">{r.sku ?? '—'}</td>
                  <td className="p-2 border text-right">
                    {Number(r.stock_qty)} {low && <span className="ml-2">🔔</span>}
                  </td>
                  <td className="p-2 border text-right">{r.reorder_level}</td>
                  <td className="p-2 border text-right">{fmtEur(r.price_eur)}</td>
                  <td className="p-2 border text-center">
                    <div className="flex items-center justify-center gap-3">
                      <a className="underline" href={`/movements/new?product=${r.id}`}>Movimento</a>
                      {role === 'admin' && (
                        <>
                          <span className="text-gray-300">·</span>
                          <a className="underline" href={`/products/${r.id}/edit`}>Modifica</a>
                        </>
                      )}
                      {role === 'admin' && (r.active ? (
                        <button
                          className="text-red-600 underline"
                          onClick={()=>deactivate(r.id)}
                          title="Nascondi dalla lista (senza perdere i dati)"
                        >
                          Disattiva
                        </button>
                      ) : (
                        <button
                          className="text-green-700 underline"
                          onClick={()=>reactivate(r.id)}
                        >
                          Riattiva
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td className="p-3 text-center text-sm text-gray-600" colSpan={6}>
                  Nessun prodotto da mostrare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}