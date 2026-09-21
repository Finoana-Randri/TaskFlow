'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { apiUrl } from '../lib/api';

export interface AttachmentItem {
  id: string | number;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + (sizes[i] || 'Go');
}

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return FileSpreadsheet;
  return FileText;
}

export function getFileBadgeColor(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'file-badge--image';
  if (mimeType.includes('pdf')) return 'file-badge--pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return 'file-badge--spreadsheet';
  return 'file-badge--default';
}

export default function DocumentPreviewModal({
  attachment,
  onClose,
}: {
  attachment: AttachmentItem | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textPreview, setTextPreview] = useState('');
  const [textPreviewError, setTextPreviewError] = useState(false);

  const isImage = Boolean(attachment?.mimeType.startsWith('image/'));
  const isPdf = Boolean(attachment?.mimeType.includes('pdf'));
  const isText = Boolean(
    attachment?.mimeType.startsWith('text/') || attachment?.mimeType.includes('json')
  );
  const isOffice = Boolean(
    attachment?.mimeType.includes('word') ||
      attachment?.mimeType.includes('excel') ||
      attachment?.mimeType.includes('spreadsheet') ||
      attachment?.mimeType.includes('powerpoint') ||
      attachment?.mimeType.includes('presentation')
  );
  const fullUrl = attachment
    ? attachment.url.startsWith('http')
      ? attachment.url
      : apiUrl(attachment.url)
    : '';
  const hasAttachment = Boolean(attachment);

  useEffect(() => {
    let cancelled = false;

    if (!hasAttachment || !isText) {
      setTextPreview('');
      setTextPreviewError(false);
      return () => {
        cancelled = true;
      };
    }

    fetch(fullUrl)
      .then((response) => {
        if (!response.ok) throw new Error('preview unavailable');
        return response.text();
      })
      .then((content) => {
        if (!cancelled) {
          setTextPreview(content);
          setTextPreviewError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setTextPreviewError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [fullUrl, hasAttachment, isText]);

  if (!attachment) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="document-modal bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl border ${getFileBadgeColor(attachment.mimeType)}`}>
              {React.createElement(getFileIcon(attachment.mimeType), { className: 'w-4 h-4' })}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 truncate max-w-md">
                {attachment.name}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {formatFileSize(attachment.size)} • {attachment.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1 shadow-2xs mr-2">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                  title="Dézoomer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-medium text-zinc-600 px-1">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                  title="Zoomer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
                  title="Pivoter"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Télécharger</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80 transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-zinc-900/5 relative overflow-auto flex items-center justify-center p-4">
          {isImage ? (
            <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={fullUrl}
                alt={attachment.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
                }}
                className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-lg border border-zinc-200 bg-white"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${fullUrl}#toolbar=1`}
              title={attachment.name}
              className="w-full h-full rounded-xl border border-zinc-200 bg-white shadow-xs"
            />
          ) : isText ? (
            <div className="w-full h-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-auto">
              {textPreviewError ? (
                <div className="h-full flex items-center justify-center p-8 text-center text-sm text-zinc-500">
                  Impossible de charger l’aperçu de ce fichier texte.
                </div>
              ) : (
                <pre className="p-5 text-xs sm:text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap break-words font-mono">
                  {textPreview || 'Chargement de l’aperçu…'}
                </pre>
              )}
            </div>
          ) : isOffice ? (
            <div className="text-center p-8 bg-white rounded-3xl border border-zinc-200 max-w-md shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                {React.createElement(getFileIcon(attachment.mimeType), { className: 'w-8 h-8' })}
              </div>
              <h4 className="font-bold text-base text-zinc-900 mb-1">Aperçu du document</h4>
              <p className="text-xs text-zinc-500 mb-6">
                Ce format peut être ouvert dans votre suite bureautique. Le fichier reste attaché à cette tâche et peut être téléchargé à tout moment.
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir le document</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-3xl border border-zinc-200 max-w-md shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 mb-1">{attachment.name}</h4>
              <p className="text-xs text-zinc-500 mb-6">
                Ce type de document ne peut pas être visualisé directement dans le navigateur. Vous pouvez l&apos;ouvrir ou le télécharger sur votre appareil.
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir dans un nouvel onglet</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
