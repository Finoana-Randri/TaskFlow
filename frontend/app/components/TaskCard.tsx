'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from '@apollo/client';
import { DELETE_TASK } from '../lib/graphql/mutation';
import { GET_PROJECT_TASKS } from '../lib/graphql/queries';
import SubTaskList from './SubTaskList';
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
      className={`bg-white border rounded-xl p-4 transition-all duration-200 ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-indigo-500/50 border-indigo-400 rotate-1 scale-[1.02] cursor-grabbing opacity-95'
          : 'border-gray-200 shadow-xs hover:shadow-md group/card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            type="button"
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-600 p-1 -ml-1 rounded-md hover:bg-gray-100 transition touch-none select-none flex-shrink-0"
            title="Glisser pour déplacer"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-sm text-gray-900 leading-snug flex-1 pt-0.5">
            {task.title}
          </h3>
        </div>

        {!isOverlay && onDelete && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            className="opacity-0 group-hover/card:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
            title="Supprimer la tâche"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {projectId && (
        <SubTaskList
          taskId={Number(task.id)}
          projectId={Number(projectId)}
          subtasks={task.subtasks || []}
        />
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
        className="h-24 border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-xl transition-all duration-200 opacity-60"
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
