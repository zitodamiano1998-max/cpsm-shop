'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Category = { id:number; name:string };
type Role = 'admin'|'desk';

export default function ProductEditClient() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [role, setRole] = useState<Role>('desk');
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // campi prodotto
  const [name, setName] = useState('');
  const [sku, setSku] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number|null>(null);
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [reorder, setReorder] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);

  useEffect(()=>{(async ()=>{
    // auth
    const { data: au } = await supabase.auth.getUser();
    const user = au?.user;
    if (!user) { router.replace('/login'); return; }

    // ruolo
    const { data: r } = await supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
    if (r?.role !== 'admin') { router.replace('/products'); return; }
    setRole('admin');

    // categorie
    const { data: cs } = await supabase.from('categories').select('id,name').order('name');
    setCats((cs ?? []) as any);

    // prodotto
    const { data: p, error } = await supabase
      .from('products')
      .select('id, name, sku, category_id, price_eur, cost_eur, reorder_level, active')
      .eq('id', id)
      .maybeSingle();

    if (error || !p) { setErr('Prodotto non trovato'); setLoading(false); return; }

    setName(p.name);
    setSku(p.sku ?? '');
    setCategoryId(p.category_id ?? null);
    setPrice(Number(p.price_eur ?? 0));
    setCost(Number(p.cost_eur ?? 0));
    setReorder(Number(p.reorder_level ?? 0));
    setActive(!!p.active);

    setLoading(false);
  })();},[id, router]);

  const save = async () => {
    setErr(null);
    if (!name || !categoryId) { setErr('Nome e categoria sono obbligatori'); return; }
    const { error } = await supabase.from('products').update({
      name,
      sku: sku.trim() || null,
      category_id: categoryId,
      price_eur: price,
      cost_eur: cost,
      reorder_level: reorder,
      active
    }).eq('id', id);
    if (error) { setErr(error.message); return; }
    router.push('/products');
  };

  if (loading) return <main className="p-6">Caricamento…</main>;
  if (role !== 'admin') return null;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modifica prodotto</h1>
        <a href="/products" className="rounded-2xl px-3 py-2 border hover:shadow">← Prodotti</a>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="grid gap-3 max-w-xl">
        <label className="block">Nome
          <input className="w-full border rounded px-3 py-2"
                 value={name} onChange={e=>setName(e.target.value)} />
        </label>

        <label className="block">SKU
          <input className="w-full border rounded px-3 py-2"
                 value={sku} onChange={e=>setSku(e.target.value)} />
        </label>

        <label className="block">Categoria
          <select className="w-full border rounded px-3 py-2"
                  value={categoryId ?? ''} onChange={e=>setCategoryId(Number(e.target.value))}>
            <option value="" disabled>Seleziona</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="block">Prezzo unitario (€)
          <input type="number" step="0.01" className="w-full border rounded px-3 py-2"
                 value={price} onChange={e=>setPrice(Number(e.target.value))} />
        </label>

        <label className="block">Costo unitario (€)
          <input type="number" step="0.01" className="w-full border rounded px-3 py-2"
                 value={cost} onChange={e=>setCost(Number(e.target.value))} />
        </label>

        <label className="block">Soglia sottoscorta
          <input type="number" className="w-full border rounded px-3 py-2"
                 value={reorder} onChange={e=>setReorder(Number(e.target.value))} />
        </label>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
          Attivo (visibile in lista)
        </label>

        <div className="flex gap-2">
          <button onClick={save} className="rounded-2xl px-4 py-2 bg-black text-white">Salva</button>
          <a href="/products" className="rounded-2xl px-4 py-2 border">Annulla</a>
        </div>
      </div>
    </main>
  );
}