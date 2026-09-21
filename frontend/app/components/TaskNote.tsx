'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Loader2, StickyNote } from 'lucide-react';
import { UPDATE_TASK_NOTE } from '../lib/graphql/mutation';

export default function TaskNote({
  taskId,
  initialNote,
}: {
  taskId: number;
  initialNote?: string | null;
}) {
  const normalizedInitialNote = initialNote || '';
  const [note, setNote] = useState(normalizedInitialNote);
  const [savedNote, setSavedNote] = useState(normalizedInitialNote);
  const [saving, setSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [updateTaskNote] = useMutation(UPDATE_TASK_NOTE);

  useEffect(() => {
    setNote(normalizedInitialNote);
    setSavedNote(normalizedInitialNote);
    setHasError(false);
  }, [normalizedInitialNote]);

  const handleBlur = async () => {
    const nextNote = note.trim();
    if (nextNote === savedNote) return;

    setSaving(true);
    setHasError(false);

    try {
      await updateTaskNote({
        variables: {
          taskId: Number(taskId),
          note: nextNote,
        },
        optimisticResponse: {
          updateTaskNote: {
            __typename: 'Task',
            id: Number(taskId),
            note: nextNote,
          },
        },
      });
      setNote(nextNote);
      setSavedNote(nextNote);
    } catch (error) {
      console.error('Error updating task note:', error);
      setHasError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="task-note" onPointerDown={(event) => event.stopPropagation()}>
      <div className="task-note__header">
        <label className="task-note__label" htmlFor={`task-note-${taskId}`}>
          <StickyNote className="h-3.5 w-3.5" />
          <span>Note</span>
        </label>
        <span className="task-note__status" aria-live="polite">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Enregistrement…
            </>
          ) : hasError ? (
            'Échec de l’enregistrement'
          ) : savedNote ? (
            'Enregistrée'
          ) : (
            'Optionnelle'
          )}
        </span>
      </div>

      <textarea
        id={`task-note-${taskId}`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={handleBlur}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        rows={3}
        maxLength={2000}
        placeholder="Ajoutez un contexte, une consigne ou une référence…"
        className="task-note__field"
      />
    </div>
  );
}
