'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Sales = { day: string; revenue_cents: number; lines: number };
type Purch = { day: string; cost_cents: number; lines: number };
const fmtEur = (c:number)=> (c/100).toLocaleString('it-IT',{style:'currency',currency:'EUR'});

export default function Reports() {
  const router = useRouter();
  const [sales, setSales] = useState<Sales[]>([]);
  const [purch, setPurch] = useState<Purch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{(async ()=>{
    const { data: au } = await supabase.auth.getUser();
    if (!au?.user) { router.replace('/login'); return; }
    const s = await supabase.from('v_sales_daily').select('*').limit(31);
    const p = await supabase.from('v_purchases_daily').select('*').limit(31);
    setSales(s.data ?? []); setPurch(p.data ?? []);
    setLoading(false);
  })();},[router]);

  if (loading) return <main className="p-6">Caricamento…</main>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Report</h1>
        <a href="/dashboard" className="rounded-2xl px-3 py-2 border hover:shadow">← Dashboard</a>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">Ricavi (ultimi giorni)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[500px] w-full border">
            <thead className="bg-gray-50"><tr>
              <th className="text-left p-2 border">Giorno</th>
              <th className="text-right p-2 border">Ricavo</th>
              <th className="text-right p-2 border">Righe</th>
            </tr></thead>
            <tbody>
              {sales.map(r=>(
                <tr key={r.day} className="border-b">
                  <td className="p-2 border">{r.day}</td>
                  <td className="p-2 border text-right">{fmtEur(r.revenue_cents)}</td>
                  <td className="p-2 border text-right">{r.lines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Costi (ultimi giorni)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[500px] w-full border">
            <thead className="bg-gray-50"><tr>
              <th className="text-left p-2 border">Giorno</th>
              <th className="text-right p-2 border">Costo</th>
              <th className="text-right p-2 border">Righe</th>
            </tr></thead>
            <tbody>
              {purch.map(r=>(
                <tr key={r.day} className="border-b">
                  <td className="p-2 border">{r.day}</td>
                  <td className="p-2 border text-right">{fmtEur(r.cost_cents)}</td>
                  <td className="p-2 border text-right">{r.lines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}