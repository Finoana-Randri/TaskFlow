import { Suspense } from 'react';
import KanbanBoard from '@/app/components/KanbanBoard';

export default function KanbanPage() {
  return (
    <main>
      <h1>Tableau Kanban</h1>
      <Suspense fallback={<p>Chargement...</p>}>
        <KanbanBoard />
      </Suspense>
    </main>
  );
}
