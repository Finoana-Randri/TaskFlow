'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_RECENT_LOGS } from '../lib/graphql/queries';
import { ACTIVITY_LOGGED_SUBSCRIPTION } from '../lib/graphql/subscriptions';
import {
  Terminal,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
  Radio,
  Pause,
  Play,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface LogItem {
  id: string;
  timestamp: string;
  type: string;
  action: string;
  message: string;
  user?: string | null;
  details?: string | null;
}

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Load initial logs with backup polling
  const { data: initialData } = useQuery(GET_RECENT_LOGS, {
    fetchPolicy: 'network-only',
    pollInterval: 2500,
  });

  useEffect(() => {
    if (initialData?.getRecentLogs) {
      setLogs((prev) => {
        const fetchedLogs = [...initialData.getRecentLogs].reverse();
        if (prev.length === 0) return fetchedLogs;
        const existingIds = new Set(prev.map((l) => l.id));
        const newItems = fetchedLogs.filter((l) => !existingIds.has(l.id));
        if (newItems.length > 0) {
          return [...prev, ...newItems];
        }
        return prev;
      });
    }
  }, [initialData]);

  // Subscribe to real-time logs
  const { data: subData, error: subError } = useSubscription(ACTIVITY_LOGGED_SUBSCRIPTION);

  useEffect(() => {
    if (subData?.activityLogged && !isPaused) {
      const newLog: LogItem = subData.activityLogged;
      setLogs((prev) => {
        // Prevent duplicate IDs if already present
        if (prev.some((l) => l.id === newLog.id)) return prev;
        return [...prev, newLog];
      });
    }
  }, [subData, isPaused]);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (isExpanded && !isPaused && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, isExpanded, isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getBadgeStyle = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'AUTH':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'CREATE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'UPDATE':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'DELETE':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full mt-8">
      <div
        className={`bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 font-mono text-xs ${
          isMaximized ? 'fixed inset-4 z-50 flex flex-col' : ''
        }`}
      >
        {/* Header Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>

            <div className="flex items-center space-x-2 text-gray-200 font-semibold pl-2 border-l border-gray-800">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Backend Activity Stream</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{subError ? 'FALLBACK' : 'LIVE WS'}</span>
            </div>

            <span className="text-gray-500 text-[11px]">({logs.length} logs)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-lg border transition ${
                isPaused
                  ? 'bg-amber-900/40 border-amber-700 text-amber-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
              title={isPaused ? 'Reprendre le flux' : 'Mettre en pause le flux'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition"
              title="Effacer les logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition"
              title={isMaximized ? 'Réduire' : 'Plein écran'}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition"
              title={isExpanded ? 'Réduire le panneau' : 'Agrandir le panneau'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isExpanded && (
          <div
            ref={logsContainerRef}
            className={`p-4 overflow-y-auto space-y-2 select-text ${
              isMaximized ? 'flex-1' : 'max-h-64'
            }`}
          >
            {logs.length === 0 ? (
              <div className="py-6 text-center text-gray-600 flex flex-col items-center justify-center">
                <Activity className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
                <p>En attente d&apos;activité backend...</p>
                <p className="text-[10px] text-gray-700 mt-0.5">
                  Effectuez une action (créer tâche, changer statut, ajouter sous-tâche) pour voir les logs en temps réel.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-gray-900/60 transition group font-mono text-[11px] leading-relaxed"
                >
                  <span className="text-gray-500 flex-shrink-0 select-none">
                    [{formatTime(log.timestamp)}]
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold tracking-wide uppercase flex-shrink-0 ${getBadgeStyle(
                      log.type
                    )}`}
                  >
                    {log.type}
                  </span>

                  {log.action && (
                    <span className="text-indigo-400 font-medium flex-shrink-0">
                      [{log.action}]
                    </span>
                  )}

                  <span className="text-gray-300 flex-1 break-all">
                    {log.message}
                  </span>

                  {log.user && (
                    <span className="text-gray-500 text-[10px] flex-shrink-0">
                      @{log.user}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
