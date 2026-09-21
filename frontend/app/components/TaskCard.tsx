'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@apollo/client';
import { DELETE_TASK } from '../lib/graphql/mutation';
import { GET_PROJECT_TASKS } from '../lib/graphql/queries';
import TaskNote from './TaskNote';
import SubTaskList from './SubTaskList';
import AttachmentSection from './AttachmentSection';
import { GripVertical, Trash2 } from 'lucide-react';

export function TaskCardView({
  task,
  projectId,
  isOverlay = false,
  onDelete,
  dragHandleProps,
}: {
  task: any;
  projectId?: number;
  isOverlay?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
  dragHandleProps?: any;
}) {
  return (
    <div
      className={`task-card bg-white border rounded-xl p-3.5 transition-all duration-200 ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-indigo-500/60 border-indigo-400 rotate-1 scale-[1.02] cursor-grabbing opacity-95 bg-white'
          : 'border-zinc-200/80 shadow-2xs hover:shadow-md hover:border-zinc-300 group/card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            type="button"
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-indigo-600 p-1 -ml-1 rounded-md hover:bg-zinc-100 transition-colors touch-none select-none flex-shrink-0"
            title="Glisser pour déplacer"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-sm text-zinc-900 leading-snug flex-1 pt-0.5 break-words">
            {task.title}
          </h3>
        </div>

        {!isOverlay && onDelete && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            className="danger-control opacity-0 group-hover/card:opacity-100 p-1 rounded-md transition-all cursor-pointer flex-shrink-0"
            title="Supprimer la tâche"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {projectId && (
        <>
          <TaskNote
            taskId={Number(task.id)}
            initialNote={task.note}
          />

          <SubTaskList
            taskId={Number(task.id)}
            projectId={Number(projectId)}
            subtasks={task.subtasks || []}
          />

          <AttachmentSection
            taskId={Number(task.id)}
            projectId={Number(projectId)}
            attachments={task.attachments || []}
          />
        </>
      )}
    </div>
  );
}

export default function TaskCard({
  task,
  projectId,
}: {
  task: any;
  projectId: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    data: {
      type: 'Task',
      task,
    },
  });

  const [deleteTask] = useMutation(DELETE_TASK, {
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
  };

  const handleDeleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Supprimer la tâche "${task.title}" ?`)) return;
    try {
      await deleteTask({
        variables: { taskId: Number(task.id) },
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl transition-all duration-200 opacity-60"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardView
        task={task}
        projectId={projectId}
        onDelete={handleDeleteTask}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
