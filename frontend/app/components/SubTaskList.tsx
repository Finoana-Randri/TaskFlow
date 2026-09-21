'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { TOGGLE_SUBTASK, DELETE_SUBTASK, CREATE_SUBTASK } from '../lib/graphql/mutation';
import { GET_PROJECT_TASKS } from '../lib/graphql/queries';
import { Check, Trash2, Plus, CornerDownLeft, X } from 'lucide-react';

export default function SubTaskList({
  taskId,
  projectId,
  subtasks = [],
}: {
  taskId: number;
  projectId: number;
  subtasks: any[];
}) {
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const [createSubTask] = useMutation(CREATE_SUBTASK, {
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const [toggleSubTask] = useMutation(TOGGLE_SUBTASK, {
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const [deleteSubTask] = useMutation(DELETE_SUBTASK, {
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskTitle.trim()) return;

    setLoading(true);
    try {
      await createSubTask({
        variables: {
          title: newSubTaskTitle.trim(),
          taskId: Number(taskId),
        },
      });
      setNewSubTaskTitle('');
      setIsAdding(false);
    } catch (err: any) {
      console.error('Error adding subtask:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    try {
      await toggleSubTask({
        variables: { id: Number(subtaskId) },
      });
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    try {
      await deleteSubTask({
        variables: { id: Number(subtaskId) },
      });
    } catch (err) {
      console.error('Error deleting subtask:', err);
    }
  };

  const completedCount = subtasks.filter((s) => s.done).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="subtask-panel mt-3 pt-3 border-t border-zinc-100" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Sous-tâches ({completedCount}/{totalCount})
        </span>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter</span>
          </button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {subtasks.length > 0 && (
        <ul className="space-y-1 mb-2">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center justify-between group/sub px-2 py-1 rounded-md hover:bg-zinc-50 text-xs text-zinc-700 transition"
            >
              <div
                onClick={(e) => handleToggle(e, subtask.id)}
                className="flex items-center gap-2 flex-1 cursor-pointer select-none min-w-0"
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition flex-shrink-0 ${
                    subtask.done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-zinc-300 hover:border-indigo-400 bg-white'
                  }`}
                >
                  {subtask.done && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={`truncate ${subtask.done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                  {subtask.title}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => handleDelete(e, subtask.id)}
                className="opacity-0 group-hover/sub:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer flex-shrink-0 ml-1"
                title="Supprimer la sous-tâche"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <form onSubmit={handleAddSubTask} className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            disabled={loading}
            value={newSubTaskTitle}
            onChange={(e) => setNewSubTaskTitle(e.target.value)}
            placeholder="Titre de la sous-tâche..."
            className="flex-1 px-2.5 py-1 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition"
          />
          <button
            type="submit"
            disabled={loading || !newSubTaskTitle.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-1 rounded-lg transition cursor-pointer flex-shrink-0"
            title="Valider"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewSubTaskTitle('');
            }}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg transition cursor-pointer flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
