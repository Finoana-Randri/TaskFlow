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
import {
  Plus,
  ArrowLeft,
  RefreshCw,
  Layers,
  CheckCircle2,
  Clock,
  CircleDot,
  FolderKanban,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';

const columns = ['todo', 'doing', 'done'] as const;
type ColumnType = (typeof columns)[number];

const columnConfig: Record<
  string,
  {
    label: string;
    icon: any;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
    hoverBg: string;
    dotColor: string;
  }
> = {
  todo: {
    label: 'À faire',
    icon: CircleDot,
    accentColor: 'border-indigo-400',
    badgeBg: 'bg-indigo-50 border border-indigo-200/60',
    badgeText: 'text-indigo-700',
    hoverBg: 'bg-indigo-50/70 ring-2 ring-indigo-400/50',
    dotColor: 'bg-indigo-500',
  },
  doing: {
    label: 'En cours',
    icon: Clock,
    accentColor: 'border-amber-400',
    badgeBg: 'bg-amber-50 border border-amber-200/60',
    badgeText: 'text-amber-700',
    hoverBg: 'bg-amber-50/70 ring-2 ring-amber-400/50',
    dotColor: 'bg-amber-500',
  },
  done: {
    label: 'Terminé',
    icon: CheckCircle2,
    accentColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-50 border border-emerald-200/60',
    badgeText: 'text-emerald-700',
    hoverBg: 'bg-emerald-50/70 ring-2 ring-emerald-400/50',
    dotColor: 'bg-emerald-500',
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
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
};

function DroppableColumn({
  column,
  count,
  onAddTask,
  children,
}: {
  column: ColumnType;
  count: number;
  onAddTask: (col: ColumnType) => void;
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
    accentColor: 'border-zinc-300',
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-700',
    hoverBg: 'bg-zinc-100 ring-2 ring-zinc-300',
    dotColor: 'bg-zinc-400',
  };
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex flex-col bg-zinc-100/60 border border-zinc-200/80 rounded-2xl p-3.5 sm:p-4 min-h-[520px] transition-all duration-200 ${
        isOver ? config.hoverBg : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-200/70">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`}></span>
          <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-zinc-500" />
            <span>{config.label}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.badgeBg} ${config.badgeText}`}>
            {count}
          </span>
          <button
            onClick={() => onAddTask(column)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 transition cursor-pointer"
            title={`Ajouter une tâche dans ${config.label}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column Cards Container */}
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

  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('todo');
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (data?.getProjectTasks) {
      setTasks(data.getProjectTasks);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
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

  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
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

  const handleOpenAddTaskForColumn = (col: ColumnType) => {
    setTargetStatus(col);
    setShowModal(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!projectId || !numProjectId) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Aucun projet sélectionné</h2>
          <p className="text-zinc-500 text-xs sm:text-sm mb-6 leading-relaxed">
            Veuillez choisir un projet depuis votre espace pour afficher et réorganiser son tableau Kanban.
          </p>
          <Link
            href="/project"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition text-xs sm:text-sm shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Consulter mes projets</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-9 h-9 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-zinc-500 font-medium">Chargement du tableau Kanban...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm shadow-xs">
          <p className="font-bold text-base mb-1">Accès refusé ou erreur serveur</p>
          <p className="mb-6 text-rose-600 text-xs">{error.message}</p>
          <Link
            href="/project"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-xl transition text-xs shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retourner aux projets</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/project"
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition shadow-2xs"
            title="Retour à mes projets"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Tableau Kanban</h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                Projet #{numProjectId}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <CircleDot className="w-3 h-3 text-indigo-500" />
                {groupedTasks.todo.length} à faire
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                {groupedTasks.doing.length} en cours
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {groupedTasks.done.length} terminées
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition cursor-pointer shadow-2xs"
            title="Rafraîchir les tâches"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setTargetStatus('todo');
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((column) => (
            <DroppableColumn
              key={column}
              column={column}
              count={groupedTasks[column]?.length || 0}
              onAddTask={handleOpenAddTaskForColumn}
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
                <div className="h-32 border-2 border-dashed border-zinc-200/80 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-400 bg-white/40">
                  <p className="font-medium">Aucune tâche</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Glissez une tâche ou cliquez sur +</p>
                </div>
              )}
            </DroppableColumn>
          ))}
        </div>

        {/* Smooth Drag Overlay */}
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
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">Nouvelle tâche</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Titre de la tâche
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Implémenter l'authentification JWT"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Colonne de destination
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="todo">À faire</option>
                    <option value="doing">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask || !title.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {creatingTask ? 'Création...' : 'Ajouter la tâche'}
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
