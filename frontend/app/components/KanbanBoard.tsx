'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROJECT_TASKS, GET_PROJECT_COLUMNS } from '@/app/lib/graphql/queries';
import {
  CREATE_TASK,
  UPDATE_TASK_STATUS,
  CREATE_COLUMN,
  DELETE_COLUMN,
} from '@/app/lib/graphql/mutation';
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
  FolderKanban,
  Sparkles,
  X,
  Columns,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';

export interface ColumnData {
  id: string | number;
  name: string;
  slug: string;
  order: number;
  color?: string;
  projectId?: number;
}

const COLOR_MAP: Record<
  string,
  {
    dotColor: string;
    badgeBg: string;
    badgeText: string;
    hoverBg: string;
  }
> = {
  indigo: {
    dotColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 border border-indigo-200/60',
    badgeText: 'text-indigo-700',
    hoverBg: 'bg-indigo-50/70 ring-2 ring-indigo-400/50',
  },
  amber: {
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 border border-amber-200/60',
    badgeText: 'text-amber-700',
    hoverBg: 'bg-amber-50/70 ring-2 ring-amber-400/50',
  },
  emerald: {
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 border border-emerald-200/60',
    badgeText: 'text-emerald-700',
    hoverBg: 'bg-emerald-50/70 ring-2 ring-emerald-400/50',
  },
  rose: {
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 border border-rose-200/60',
    badgeText: 'text-rose-700',
    hoverBg: 'bg-rose-50/70 ring-2 ring-rose-400/50',
  },
  purple: {
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 border border-purple-200/60',
    badgeText: 'text-purple-700',
    hoverBg: 'bg-purple-50/70 ring-2 ring-purple-400/50',
  },
  cyan: {
    dotColor: 'bg-cyan-500',
    badgeBg: 'bg-cyan-50 border border-cyan-200/60',
    badgeText: 'text-cyan-700',
    hoverBg: 'bg-cyan-50/70 ring-2 ring-cyan-400/50',
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
  onDeleteColumn,
  canDelete,
  children,
}: {
  column: ColumnData;
  count: number;
  onAddTask: (slug: string) => void;
  onDeleteColumn: (column: ColumnData) => void;
  canDelete: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.slug,
    data: {
      type: 'Column',
      column,
    },
  });

  const colors = COLOR_MAP[column.color || 'indigo'] || COLOR_MAP.indigo;

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column min-w-[300px] flex-1 flex flex-col bg-zinc-100/60 border border-zinc-200/80 rounded-2xl p-3.5 sm:p-4 min-h-[520px] transition-all duration-200 group/col ${
        isOver ? colors.hoverBg : ''
      }`}
    >
      {/* Column Header */}
      <div className="kanban-column__header flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-200/70">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dotColor}`}></span>
          <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider truncate">
            {column.name}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors.badgeBg} ${colors.badgeText}`}>
            {count}
          </span>
          <button
            onClick={() => onAddTask(column.slug)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 transition cursor-pointer"
            title={`Ajouter une tâche dans ${column.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {canDelete && (
            <button
              onClick={() => onDeleteColumn(column)}
              className="opacity-0 group-hover/col:opacity-100 p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
              title={`Supprimer la colonne "${column.name}"`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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

  const { data, loading, error, refetch: refetchTasks } = useQuery(GET_PROJECT_TASKS, {
    variables: { projectId: numProjectId },
    skip: !numProjectId,
  });

  const { data: colsData, refetch: refetchCols } = useQuery(GET_PROJECT_COLUMNS, {
    variables: { projectId: numProjectId },
    skip: !numProjectId,
  });

  const [createTask, { loading: creatingTask }] = useMutation(CREATE_TASK);
  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS);
  const [createColumnMutation, { loading: creatingCol }] = useMutation(CREATE_COLUMN);
  const [deleteColumnMutation] = useMutation(DELETE_COLUMN);

  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // Column creation modal state
  const [showColModal, setShowColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('indigo');

  const [title, setTitle] = useState('');
  const [targetStatus, setTargetStatus] = useState<string>('todo');
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Listen for attachment updates dispatched from AttachmentSection
  useEffect(() => {
    const handleAttachmentUpdated = (e: any) => {
      if (e.detail?.projectId === numProjectId) {
        refetchTasks();
      }
    };
    window.addEventListener('task-attachment-updated', handleAttachmentUpdated);
    return () => window.removeEventListener('task-attachment-updated', handleAttachmentUpdated);
  }, [numProjectId, refetchTasks]);

  useEffect(() => {
    if (data?.getProjectTasks) {
      setTasks(data.getProjectTasks);
    }
  }, [data]);

  const columns: ColumnData[] = useMemo(() => {
    if (colsData?.getProjectColumns && colsData.getProjectColumns.length > 0) {
      return colsData.getProjectColumns;
    }
    return [
      { id: 1, name: 'À faire', slug: 'todo', order: 0, color: 'indigo' },
      { id: 2, name: 'En cours', slug: 'doing', order: 1, color: 'amber' },
      { id: 3, name: 'Terminé', slug: 'done', order: 2, color: 'emerald' },
    ];
  }, [colsData]);

  const columnSlugs = useMemo(() => columns.map((c) => c.slug), [columns]);

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
    const result: Record<string, any[]> = {};
    columns.forEach((col) => {
      result[col.slug] = [];
    });
    tasks.forEach((task) => {
      const colSlug = task.status || (columns[0]?.slug || 'todo');
      if (result[colSlug]) {
        result[colSlug].push(task);
      } else {
        const fallback = columns[0]?.slug || 'todo';
        if (!result[fallback]) result[fallback] = [];
        result[fallback].push(task);
      }
    });
    return result;
  }, [tasks, columns]);

  const attachmentCount = useMemo(
    () => tasks.reduce((total, task) => total + (task.attachments?.length || 0), 0),
    [tasks]
  );

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

    let overColumn: string | null = null;
    if (columnSlugs.includes(overId)) {
      overColumn = overId;
    } else {
      const overTask = tasks.find((t) => t.id.toString() === overId);
      if (overTask) {
        overColumn = overTask.status;
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

    let targetCol: string = columns[0]?.slug || 'todo';
    if (columnSlugs.includes(overId)) {
      targetCol = overId;
    } else {
      const overTask = tasks.find((t) => t.id.toString() === overId);
      if (overTask) {
        targetCol = overTask.status;
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
              note: originalTask?.note || '',
              completed: targetCol === 'done',
              projectId: numProjectId,
              subtasks: originalTask?.subtasks || [],
              attachments: originalTask?.attachments || [],
            },
          },
          refetchQueries: [
            { query: GET_PROJECT_TASKS, variables: { projectId: numProjectId } },
          ],
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

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !numProjectId) return;

    try {
      await createColumnMutation({
        variables: {
          projectId: numProjectId,
          name: newColName.trim(),
          color: newColColor,
        },
        refetchQueries: [
          { query: GET_PROJECT_COLUMNS, variables: { projectId: numProjectId } },
        ],
      });
      setNewColName('');
      setShowColModal(false);
      await refetchCols();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de l’ajout de la colonne');
    }
  };

  const handleDeleteColumn = async (col: ColumnData) => {
    if (
      !confirm(
        `Supprimer la colonne "${col.name}" ? Ses tâches éventuelles seront déplacées vers la première colonne.`
      )
    ) {
      return;
    }

    try {
      await deleteColumnMutation({
        variables: { id: Number(col.id) },
        refetchQueries: [
          { query: GET_PROJECT_COLUMNS, variables: { projectId: numProjectId } },
          { query: GET_PROJECT_TASKS, variables: { projectId: numProjectId } },
        ],
      });
      await refetchCols();
      await refetchTasks();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression');
    }
  };

  const handleOpenAddTaskForColumn = (slug: string) => {
    setTargetStatus(slug);
    setShowModal(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchTasks(), refetchCols()]);
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
    <div className="kanban-page w-full max-w-none px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
      {/* Header Bar */}
      <div className="kanban-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200/80">
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
              <span>{tasks.length} {tasks.length > 1 ? 'tâches' : 'tâche'}</span>
              <span className="text-zinc-300">•</span>
              <span>{columns.length} {columns.length > 1 ? 'colonnes actives' : 'colonne active'}</span>
              <span className="text-zinc-300">•</span>
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3 text-indigo-500" />
                {attachmentCount} {attachmentCount > 1 ? 'documents' : 'document'}
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
            onClick={() => setShowColModal(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 font-medium px-3.5 py-2.5 rounded-xl shadow-2xs hover:shadow-xs transition text-xs sm:text-sm cursor-pointer"
          >
            <Columns className="w-4 h-4 text-indigo-600" />
            <span>Ajouter une colonne</span>
          </button>
          <button
            onClick={() => {
              setTargetStatus(columns[0]?.slug || 'todo');
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* Kanban Columns with horizontal scroll support */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="kanban-columns flex items-start gap-5 overflow-x-auto pb-4 pt-1">
          {columns.map((column) => (
            <DroppableColumn
              key={column.slug}
              column={column}
              count={groupedTasks[column.slug]?.length || 0}
              onAddTask={handleOpenAddTaskForColumn}
              onDeleteColumn={handleDeleteColumn}
              canDelete={columns.length > 1}
            >
              <SortableContext
                items={(groupedTasks[column.slug] || []).map((task) => task.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                {(groupedTasks[column.slug] || []).map((task) => (
                  <TaskCard key={task.id} task={task} projectId={numProjectId} />
                ))}
              </SortableContext>

              {(!groupedTasks[column.slug] || groupedTasks[column.slug].length === 0) && (
                <div className="h-32 border-2 border-dashed border-zinc-200/80 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-400 bg-white/40">
                  <p className="font-medium">Aucune tâche</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Glissez une tâche ou cliquez sur +</p>
                </div>
              )}
            </DroppableColumn>
          ))}

          {/* Quick add column card button */}
          <div className="min-w-[260px] flex-shrink-0">
            <button
              onClick={() => setShowColModal(true)}
              className="w-full h-40 border-2 border-dashed border-zinc-300/80 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/30 rounded-2xl flex flex-col items-center justify-center text-indigo-700 hover:text-indigo-600 transition-all cursor-pointer group p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 group-hover:border-indigo-300 flex items-center justify-center mb-2 shadow-2xs group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Ajouter une colonne</span>
              <span className="text-[11px] text-zinc-400 mt-0.5">Revue, Validation, En test...</span>
            </button>
          </div>
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
                    placeholder="ex: Finaliser la maquette d'accueil"
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
                    {columns.map((col) => (
                      <option key={col.slug} value={col.slug}>
                        {col.name}
                      </option>
                    ))}
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

      {/* Modal Créer une Colonne */}
      {showColModal &&
        createPortal(
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Columns className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">Ajouter une colonne</h2>
                </div>
                <button
                  onClick={() => setShowColModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateColumn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Nom de la colonne
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="ex: Revue de code, Validation client..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Couleur du thème
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { id: 'indigo', label: 'Corail', color: 'bg-indigo-500' },
                      { id: 'amber', label: 'Ambre', color: 'bg-amber-500' },
                      { id: 'emerald', label: 'Sauge', color: 'bg-emerald-500' },
                      { id: 'rose', label: 'Corail profond', color: 'bg-rose-500' },
                      { id: 'purple', label: 'Ardoise', color: 'bg-purple-500' },
                      { id: 'cyan', label: 'Bleu gris', color: 'bg-cyan-500' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNewColColor(item.id)}
                        className={`h-9 rounded-xl flex items-center justify-center transition border-2 cursor-pointer ${
                          newColColor === item.id
                            ? 'border-zinc-900 scale-105 shadow-sm'
                            : 'border-transparent hover:scale-105'
                        }`}
                        title={item.label}
                      >
                        <span className={`w-5 h-5 rounded-full ${item.color}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowColModal(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCol || !newColName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {creatingCol ? 'Création...' : 'Créer la colonne'}
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
