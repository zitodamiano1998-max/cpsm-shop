'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin'|'desk'>('desk');

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [reorder, setReorder] = useState(0);
  const [cats, setCats] = useState<{id:number; name:string}[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=>{(async()=>{
    const { data: au } = await supabase.auth.getUser();
    const user = au?.user;
    if (!user) { router.replace('/login'); return; }
    const { data: r } = await supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
    if (r?.role !== 'admin') { router.replace('/products'); return; }
    setRole('admin');
    const { data: c } = await supabase.from('categories').select('id,name').order('name');
    setCats((c ?? []) as any);
  })();},[router]);

  const submit = async () => {
    setErr(null);
    if (!name || !categoryId) { setErr('Nome e categoria sono obbligatori'); return; }
    const { error } = await supabase.from('products').insert({
      name, sku: sku || null, category_id: categoryId,
      price_eur: price, cost_eur: cost, reorder_level: reorder, active: true
    });
    if (error) { setErr(error.message); return; }
    router.push('/products');
  };

  if (role !== 'admin') return null;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nuovo prodotto</h1>
      <div className="grid gap-3 max-w-lg">
        <label className="block">Nome
          <input className="w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
        </label>
        <label className="block">SKU
          <input className="w-full border rounded px-3 py-2" value={sku} onChange={e=>setSku(e.target.value)} />
        </label>
        <label className="block">Categoria
          <select className="w-full border rounded px-3 py-2"
                  value={categoryId ?? ''} onChange={e=>setCategoryId(Number(e.target.value))}>
            <option value="" disabled>Seleziona</option>
            {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">Prezzo unitario (€)
          <input type="number" step="0.01" className="w-full border rounded px-3 py-2"
                 value={price} onChange={e=>setPrice(Number(e.target.value))}/>
        </label>
        <label className="block">Costo unitario (€)
          <input type="number" step="0.01" className="w-full border rounded px-3 py-2"
                 value={cost} onChange={e=>setCost(Number(e.target.value))}/>
        </label>
        <label className="block">Soglia sottoscorta
          <input type="number" className="w-full border rounded px-3 py-2"
                 value={reorder} onChange={e=>setReorder(Number(e.target.value))}/>
        </label>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2">
          <button onClick={submit} className="rounded-2xl px-4 py-2 bg-black text-white">Salva</button>
          <a className="rounded-2xl px-4 py-2 border" href="/products">Annulla</a>
        </div>
      </div>
    </main>
  );
}