'use client';

import React, { useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_ATTACHMENT } from '../lib/graphql/mutation';
import { GET_PROJECT_TASKS } from '../lib/graphql/queries';
import { apiUrl } from '../lib/api';
import DocumentPreviewModal, {
  AttachmentItem,
  formatFileSize,
  getFileBadgeColor,
  getFileIcon,
} from './DocumentPreviewModal';
import { Paperclip, Plus, Trash2, Eye, Loader2 } from 'lucide-react';

export default function AttachmentSection({
  taskId,
  projectId,
  attachments = [],
}: {
  taskId: number;
  projectId: number;
  attachments: AttachmentItem[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<AttachmentItem | null>(null);

  const [deleteAttachment] = useMutation(DELETE_ATTACHMENT, {
    refetchQueries: [{ query: GET_PROJECT_TASKS, variables: { projectId } }],
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversizedFile = files.find((file) => file.size > 25 * 1024 * 1024);
    if (oversizedFile) {
      alert(`"${oversizedFile.name}" dépasse la taille maximale autorisée (25 Mo).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(apiUrl(`/api/tasks/${taskId}/attachments`), {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Impossible d’ajouter « ${file.name} »`);
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      window.dispatchEvent(new CustomEvent('task-attachment-updated', { detail: { taskId, projectId } }));
    } catch (err: any) {
      alert(err.message || 'Erreur de téléversement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string | number, name: string) => {
    e.stopPropagation();
    if (!confirm(`Supprimer le document "${name}" ?`)) return;

    try {
      await deleteAttachment({
        variables: { id: Number(id) },
      });
      window.dispatchEvent(new CustomEvent('task-attachment-updated', { detail: { taskId, projectId } }));
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="attachment-panel mt-2.5 pt-2 border-t border-zinc-100/90" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
          <Paperclip className="w-3 h-3 text-zinc-400" />
          <span>Documents ({attachments.length})</span>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
            title="Ajouter un document"
          >
            {uploading ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Plus className="w-2.5 h-2.5" />
                <span>Joindre</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-1 mt-1 max-h-36 overflow-y-auto pr-0.5">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.mimeType);
            const badgeColor = getFileBadgeColor(att.mimeType);
            return (
              <div
                key={att.id}
                onClick={() => setPreviewItem(att)}
                className="group/file flex items-center justify-between gap-1.5 px-2 py-1.5 bg-zinc-50 hover:bg-zinc-100/90 rounded-lg border border-zinc-200/60 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className={`p-1 rounded-md border text-[9px] ${badgeColor}`}>
                    <Icon className="w-3 h-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-800 truncate leading-tight group-hover/file:text-indigo-600 transition-colors">
                      {att.name}
                    </p>
                    <span className="text-[10px] text-zinc-400">
                      {formatFileSize(att.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewItem(att);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-indigo-600 hover:bg-white transition cursor-pointer"
                    title="Aperçu"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, att.id, att.name)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                    title="Supprimer le document"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <DocumentPreviewModal
          attachment={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
