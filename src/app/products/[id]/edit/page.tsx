import { Suspense } from 'react';
import ProductEditClient from './Client';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6">Caricamento…</main>}>
      <ProductEditClient />
    </Suspense>
  );
}