import { Suspense } from 'react';
import NewMovementClient from './Client';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6">Caricamento…</main>}>
      <NewMovementClient />
    </Suspense>
  );
}