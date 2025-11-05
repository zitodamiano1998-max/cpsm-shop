'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'desk';

type AlertRow = {
  id: number;
  product_id: number;
  current_qty: number;
  reorder_level: number;
  threshold: number;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  stock_before: number | null;
  stock_after: number | null;
  is_manual: boolean;
  product_name?: string;
  sku?: string | null;
};

export default function LowStockPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('desk');
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);

    // Auth
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) {
      router.replace('/login');
      return;
    }

    // Ruolo
    const { data: r } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', au.user.id)
      .maybeSingle();
    if (r?.role === 'admin') setRole('admin');

    // Marca tutti gli alert come "visti" per l'utente corrente
    await supabase.rpc('low_stock_mark_seen');

    // Carica alert con join al prodotto per nome/SKU
    const { data, error } = await supabase
      .from('low_stock_alerts')
      .select(
        'id, product_id, current_qty, reorder_level, threshold, status, created_at, resolved_at, stock_before, stock_after, is_manual, products:product_id (name, sku)'
      )
      .order('created_at', { ascending: false });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    const mapped: AlertRow[] = (data ?? []).map((a: any) => ({
      id: a.id,
      product_id: a.product_id,
      current_qty: a.current_qty,
      reorder_level: a.reorder_level,
      threshold: a.threshold,
      status: a.status,
      created_at: a.created_at,
      resolved_at: a.resolved_at,
      stock_before: a.stock_before ?? null,
      stock_after: a.stock_after ?? null,
      is_manual: !!a.is_manual,
      product_name: a.products?.name,
      sku: a.products?.sku ?? null,
    }));

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const visible = rows.filter((r) => (showResolved ? true : r.status === 'open'));

  const markResolved = async (id: number) => {
    if (role !== 'admin') return;
    const { error } = await supabase
      .from('low_stock_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  };

  if (loading) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sottoscorta</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            Mostra risolti
          </label>
          <a href="/products" className="rounded-2xl px-3 py-2 border hover:shadow">
            ← Prodotti
          </a>
          <a href="/dashboard" className="rounded-2xl px-3 py-2 border hover:shadow">
            Dashboard
          </a>
        </div>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border">Prodotto</th>
              <th className="text-left p-2 border">SKU</th>
              <th className="text-right p-2 border">Giacenza</th>
              <th className="text-right p-2 border">Soglia</th>
              <th className="text-left p-2 border">Stato</th>
              <th className="text-left p-2 border">Creato</th>
              <th className="text-left p-2 border">Risolto</th>
              <th className="text-right p-2 border">Prima</th>
              <th className="text-right p-2 border">Dopo</th>
              <th className="p-2 border">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2 border">{r.product_name ?? `#${r.product_id}`}</td>
                <td className="p-2 border">{r.sku ?? '—'}</td>
                <td className="p-2 border text-right">{r.current_qty}</td>
                <td className="p-2 border text-right">{r.threshold ?? r.reorder_level}</td>
                <td className="p-2 border">
                  {r.status === 'open' ? (
                    <span className="text-amber-700">Aperto</span>
                  ) : (
                    <span className="text-green-700">Risolto</span>
                  )}
                </td>
                <td className="p-2 border">
                  {new Date(r.created_at).toLocaleString('it-IT')}
                </td>
                <td className="p-2 border">
                  {r.resolved_at ? new Date(r.resolved_at).toLocaleString('it-IT') : '—'}
                </td>
                <td className="p-2 border text-right">
                  {r.stock_before ?? '—'}
                </td>
                <td className="p-2 border text-right">
                  {r.stock_after ?? '—'}
                </td>
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <a className="underline" href={`/movements/new?product=${r.product_id}`}>
                      Movimento
                    </a>
                    {role === 'admin' && r.status === 'open' && (
                      <button
                        className="underline text-green-700"
                        onClick={() => markResolved(r.id)}
                        title="Segna come ordinato / risolto"
                      >
                        Segna come ordinato / risolto
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td className="p-3 text-center text-sm text-gray-600" colSpan={10}>
                  Nessun alert da mostrare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}