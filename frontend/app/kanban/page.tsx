import { Suspense } from 'react';
import KanbanBoard from '@/app/components/KanbanBoard';

export default function KanbanPage() {
  return (
    <main>
      <Suspense fallback={<p>Chargement...</p>}>
        <KanbanBoard />
      </Suspense>
    </main>
  );
}
