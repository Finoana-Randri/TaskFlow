'use client';

import { useAuth } from './lib/auth-context';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Kanban,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 max-w-6xl mx-auto w-full">
      {/* Top Banner Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
        </span>
        <span>GraphQL Apollo • Subscriptions WebSocket • Cookies JWT</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.15] text-center max-w-4xl">
        Pilotez vos projets avec un Kanban{' '}
        <span className="text-indigo-600">
          collaboratif & temps réel
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl text-center leading-relaxed font-normal">
        Application de gestion de tâches haute performance avec drag & drop fluide, découpage en sous-tâches, authentification sécurisée et flux de logs backend en direct.
      </p>

      {/* Action CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
        {loading ? (
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        ) : user ? (
          <Link
            href="/project"
            className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm cursor-pointer group"
          >
            <span>Accéder à mes projets</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm cursor-pointer group"
            >
              <span>Commencer maintenant</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-300/80 text-zinc-700 font-medium px-6 py-3 rounded-xl shadow-2xs hover:shadow-xs transition text-sm cursor-pointer"
            >
              <span>Se connecter</span>
            </Link>
          </>
        )}
      </div>

      {/* Interactive UI Mockup Preview */}
      <div className="mt-14 w-full max-w-4xl bg-zinc-900/5 rounded-3xl p-3 sm:p-4 border border-zinc-200/80 shadow-xl">
        <div className="bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-xs">
          {/* Mock Browser/App Header */}
          <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-semibold text-zinc-600 ml-2">Tableau Kanban • Sprint GraphQL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Subscriptions Active
              </span>
            </div>
          </div>

          {/* Mock Kanban Columns Preview */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50/40">
            {/* Column 1 */}
            <div className="bg-zinc-100/70 border border-zinc-200/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  À faire
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  2
                </span>
              </div>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
                  <p className="text-xs font-medium text-zinc-900">Mise en place authentification JWT</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>2/2 sous-tâches</span>
                    <span className="text-indigo-600 font-semibold">100%</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
                  <p className="text-xs font-medium text-zinc-900">Optimiser Apollo cache queries</p>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="bg-zinc-100/70 border border-zinc-200/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  En cours
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  1
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-2xs ring-1 ring-amber-100">
                <p className="text-xs font-medium text-zinc-900">Flux d&apos;activité WebSocket en direct</p>
                <div className="mt-2.5 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="bg-zinc-100/70 border border-zinc-200/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Terminé
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  3
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs opacity-85">
                <p className="text-xs font-medium text-zinc-900 line-through text-zinc-500">Initialisation schéma Prisma</p>
                <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Vérifié
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-zinc-900 mb-1.5 text-base">Sécurité & Cookies JWT</h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Cookies HTTP-only protégés, contrôle d&apos;accès strict par projet et session utilisateur persistante.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <Kanban className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-zinc-900 mb-1.5 text-base">Kanban & Sous-tâches</h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Glisser-déposer interactif à 60 FPS avec dnd-kit, suivi de progression instantané et sous-tâches synchronisées.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-zinc-900 mb-1.5 text-base">Flux de Logs en Direct</h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Terminal d&apos;activité branché sur les GraphQL Subscriptions (WebSocket) pour inspecter les mutations serveur en temps réel.
          </p>
        </div>
      </div>

      {/* Tech Stack Footer Badges */}
      <div className="mt-14 pt-8 border-t border-zinc-200/80 w-full flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-zinc-500">
        <span className="font-semibold text-zinc-700">Technologies :</span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-700">Next.js 15</span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-700">GraphQL Apollo</span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-700">WebSocket / Subscriptions</span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-700">PostgreSQL + Prisma</span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-700">Tailwind CSS v4</span>
      </div>
    </div>
  );
}
