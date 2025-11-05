'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ProductLite, StaffRole } from '@/lib/types';

export default function NewMovementClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetId = sp.get('product');
  const [role, setRole] = useState<StaffRole>('desk');

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [productId, setProductId] = useState<number | null>(presetId ? Number(presetId) : null);
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState<'IN'|'OUT'|'ADJ'>('OUT');
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [err, setErr] = useState<string|null>(null);

  const isDesk = role === 'desk';
  const allowedReasons: Array<'IN'|'OUT'|'ADJ'> = useMemo(
    () => isDesk ? ['OUT'] : ['OUT','IN','ADJ'], [isDesk]
  );

  useEffect(() => { (async () => {
    const { data: au } = await supabase.auth.getUser();
    const user = au?.user;
    if (!user) { router.replace('/login'); return; }
    const { data: r } = await supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
    if (r?.role === 'admin') setRole('admin');

    const { data: prods } = await supabase.from('products').select('id,name').order('name');
    setProducts((prods ?? []) as any);
  })(); }, [router]);

  const submit = async () => {
    setErr(null);
    if (!productId || !qty) { setErr('Seleziona prodotto e quantità'); return; }
    const finalReason = isDesk ? 'OUT' : reason;
    const finalQty = finalReason === 'OUT' ? -Math.abs(qty) : Math.abs(qty);

    if (isDesk && finalReason !== 'OUT') { setErr('Come desk puoi registrare solo vendite'); return; }
    if (isDesk && finalQty >= 0) { setErr('Come desk la quantità deve essere negativa (uscite)'); return; }

    const payload:any = {
      product_id: productId,
      qty: finalQty,
      reason: finalReason,
      note: note || null
    };
    if (finalReason === 'OUT') payload.unit_price_cents = price;
    if (finalReason === 'IN')  payload.unit_cost_cents  = cost;

    const { error } = await supabase.from('stock_movements').insert(payload);
    if (error) { setErr(error.message); return; }
    router.push('/products');
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuovo movimento</h1>
        <a href="/dashboard" className="rounded-2xl px-3 py-2 border hover:shadow">← Dashboard</a>
      </div>

      <div className="grid gap-3 max-w-lg">
        <label className="block">Prodotto
          <select className="w-full border rounded px-3 py-2"
                  value={productId ?? ''} onChange={e=>setProductId(Number(e.target.value))}>
            <option value="" disabled>Seleziona</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="block">Tipo movimento
          <select className="w-full border rounded px-3 py-2"
                  value={reason}
                  onChange={e=>setReason(e.target.value as any)}
                  disabled={isDesk}>
            {allowedReasons.map(t => <option key={t} value={t}>
              {t === 'OUT' ? 'Vendita/Uscita' : t === 'IN' ? 'Carico/Acquisto' : 'Rettifica'}
            </option>)}
          </select>
          {isDesk && <p className="text-sm text-gray-600 mt-1">Ruolo <b>desk</b>: solo vendite (OUT)</p>}
        </label>

        <label className="block">Quantità
          <input type="number" className="w-full border rounded px-3 py-2"
                 value={qty} onChange={e=>setQty(Number(e.target.value))}/>
          {reason === 'OUT' && <small className="text-gray-600">Per OUT verrà salvata come quantità negativa</small>}
        </label>

        {reason === 'OUT' && (
          <label className="block">Prezzo unitario (centesimi)
            <input type="number" className="w-full border rounded px-3 py-2"
                   value={price} onChange={e=>setPrice(Number(e.target.value))}/>
          </label>
        )}
        {reason === 'IN' && !isDesk && (
          <label className="block">Costo unitario (centesimi)
            <input type="number" className="w-full border rounded px-3 py-2"
                   value={cost} onChange={e=>setCost(Number(e.target.value))}/>
          </label>
        )}

        <label className="block">Note
          <input className="w-full border rounded px-3 py-2" value={note} onChange={e=>setNote(e.target.value)}/>
        </label>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2">
          <button onClick={submit} className="rounded-2xl px-4 py-2 bg-black text-white">Salva</button>
          <a href="/products" className="rounded-2xl px-4 py-2 border">Annulla</a>
        </div>
      </div>
    </main>
  );
}