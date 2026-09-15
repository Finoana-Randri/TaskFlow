'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_TASKS } from '@/app/lib/graphql/queries';
import { CREATE_TASK, UPDATE_TASK_STATUS } from '@/app/lib/graphql/mutation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import TaskCard, { TaskCardView } from './TaskCard';
import LiveLogs from './LiveLogs';
import { Plus, ArrowLeft, RefreshCw, Layers, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import Link from 'next/link';

const columns = ['todo', 'doing', 'done'] as const;
type ColumnType = (typeof columns)[number];

const columnConfig: Record<string, { label: string; icon: any; color: string; badge: string; hoverBg: string }> = {
  todo: {
    label: 'À faire',
    icon: CircleDot,
    color: 'border-t-indigo-500 bg-slate-50/70',
    badge: 'bg-indigo-100 text-indigo-700',
    hoverBg: 'bg-indigo-50/60 ring-2 ring-indigo-300',
  },
  doing: {
    label: 'En cours',
    icon: Clock,
    color: 'border-t-amber-500 bg-slate-50/70',
    badge: 'bg-amber-100 text-amber-700',
    hoverBg: 'bg-amber-50/60 ring-2 ring-amber-300',
  },
  done: {
    label: 'Terminé',
    icon: CheckCircle2,
    color: 'border-t-emerald-500 bg-slate-50/70',
    badge: 'bg-emerald-100 text-emerald-700',
    hoverBg: 'bg-emerald-50/60 ring-2 ring-emerald-300',
  },
};

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
  duration: 200,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
};

function DroppableColumn({
  column,
  count,
  children,
}: {
  column: ColumnType;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column,
    data: {
      type: 'Column',
      column,
    },
  });

  const config = columnConfig[column] || {
    label: column,
    icon: Layers,
    color: 'border-t-gray-400 bg-slate-50/70',
    badge: 'bg-gray-100 text-gray-700',
    hoverBg: 'bg-indigo-50/60 ring-2 ring-indigo-300',
  };
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex flex-col border border-gray-200 border-t-4 ${
        config.color
      } rounded-2xl p-4 min-h-[500px] transition-all duration-200 ${
        isOver ? config.hoverBg : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200/80">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            {config.label}
          </h2>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
          {count}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const numProjectId = projectId ? parseInt(projectId, 10) : null;

  const { data, loading, error, refetch } = useQuery(GET_PROJECT_TASKS, {
    variables: { projectId: numProjectId },
    skip: !numProjectId,
  });

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK);
  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS);

  // Local state for tasks for ultra-smooth optimistic drag & drop
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('todo');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (data?.getProjectTasks) {
      setTasks(data.getProjectTasks);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Start dragging immediately after 3px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedTasks = useMemo(() => {
    const result: Record<ColumnType, any[]> = {
      todo: [],
      doing: [],
      done: [],
    };
    tasks.forEach((task) => {
      const col = (task.status || 'todo') as ColumnType;
      if (result[col]) {
        result[col].push(task);
      } else {
        result.todo.push(task);
      }
    });
    return result;
  }, [tasks]);

  // Collision detection: check pointer position first, then closest corners
  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    // 1. Direct pointer collisions
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // 2. Intersections with rects
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    // 3. Fallback to closest corners
    return closestCorners(args);
  }, []);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find((t) => t.id.toString() === active.id.toString());
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const activeTaskItem = tasks.find((t) => t.id.toString() === activeId);
    if (!activeTaskItem) return;

    // Is over a column?
    let overColumn: ColumnType | null = null;
    if (columns.includes(overId as ColumnType)) {
      overColumn = overId as ColumnType;
    } else {
      const overTask = tasks.find((t) => t.id.toString() === overId);
      if (overTask) {
        overColumn = overTask.status as ColumnType;
      }
    }

    if (overColumn && activeTaskItem.status !== overColumn) {
      // Optimistically move task to new column locally during drag
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id.toString() === activeId ? { ...t, status: overColumn } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = parseInt(active.id, 10);
    const overId = over.id.toString();

    let targetCol: ColumnType = 'todo';
    if (columns.includes(overId as ColumnType)) {
      targetCol = overId as ColumnType;
    } else {
      const overTask = tasks.find((t) => t.id.toString() === overId);
      if (overTask) {
        targetCol = overTask.status as ColumnType;
      }
    }

    const originalTask = data?.getProjectTasks?.find((t: any) => t.id === activeTaskId);
    const initialStatus = originalTask?.status;

    // If status changed from initial server state, call GraphQL mutation
    if (initialStatus !== targetCol) {
      try {
        await updateTaskStatus({
          variables: {
            taskId: activeTaskId,
            status: targetCol,
          },
          optimisticResponse: {
            updateTaskStatus: {
              __typename: 'Task',
              id: activeTaskId,
              status: targetCol,
              title: originalTask?.title || '',
              completed: targetCol === 'done',
              projectId: numProjectId,
              subtasks: originalTask?.subtasks || [],
            },
          },
          refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId: numProjectId } }],
        });
      } catch (err) {
        console.error('Failed to update task status:', err);
        // revert local state on error
        if (data?.getProjectTasks) {
          setTasks(data.getProjectTasks);
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    if (data?.getProjectTasks) {
      setTasks(data.getProjectTasks);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !numProjectId) return;

    try {
      await createTask({
        variables: {
          title: title.trim(),
          projectId: numProjectId,
          status: targetStatus,
        },
        refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId: numProjectId } }],
      });

      setTitle('');
      setShowModal(false);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la création de la tâche');
    }
  };

  if (!projectId || !numProjectId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun projet sélectionné</h2>
          <p className="text-gray-500 text-sm mb-6">
            Veuillez sélectionner un projet depuis votre liste de projets pour afficher son tableau Kanban.
          </p>
          <Link
            href="/project"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition text-sm shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Aller aux projets</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-gray-500">Chargement des tâches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm shadow-xs">
          <p className="font-bold text-base mb-2">Accès non autorisé ou erreur :</p>
          <p className="mb-6 text-red-600">{error.message}</p>
          <Link
            href="/project"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-xl transition text-xs shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retourner à mes projets</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/project"
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition"
            title="Retour aux projets"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Tableau Kanban</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Projet #{numProjectId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Glissez et déposez vos tâches avec prévisualisation fluide
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl shadow transition text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* Kanban Drag and Drop Columns with Smooth DragOverlay */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <DroppableColumn
              key={column}
              column={column}
              count={groupedTasks[column]?.length || 0}
            >
              <SortableContext
                items={(groupedTasks[column] || []).map((task) => task.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                {(groupedTasks[column] || []).map((task) => (
                  <TaskCard key={task.id} task={task} projectId={numProjectId} />
                ))}
              </SortableContext>

              {(!groupedTasks[column] || groupedTasks[column].length === 0) && (
                <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400">
                  Déposez une tâche ici
                </div>
              )}
            </DroppableColumn>
          ))}
        </div>

        {/* High-Fidelity Drag Overlay */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeTask ? (
            <TaskCardView task={activeTask} isOverlay={true} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Real-time Backend Activity Logs at the bottom of Kanban */}
      <LiveLogs />

      {/* Modal Créer une Tâche */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Créer une nouvelle tâche</h2>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Titre de la tâche
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Implémenter l'authentification JWT"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Colonne initiale
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="todo">À faire</option>
                    <option value="doing">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask || !title.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow transition cursor-pointer"
                  >
                    {creatingTask ? 'Création...' : 'Créer la tâche'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
