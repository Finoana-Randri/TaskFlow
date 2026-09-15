'use client';

import { useAuth } from './lib/auth-context';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-8">
        <Zap className="w-3.5 h-3.5" />
        <span>GraphQL + Apollo + Subscriptions + JWT Protection</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
        Gérez vos tâches avec <span className="text-indigo-600">Kanban & Logs en Temps Réel</span>
      </h1>

      <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
        Application To-Do moderne et collaborative : authentification sécurisée par cookies JWT, gestion de projets & sous-tâches, et affichage en streaming des logs serveur en direct.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {loading ? (
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        ) : user ? (
          <Link
            href="/project"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition text-base cursor-pointer"
          >
            <span>Voir mes projets</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition text-base cursor-pointer"
            >
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-xl shadow-sm hover:shadow transition text-base cursor-pointer"
            >
              <span>Se connecter</span>
            </Link>
          </>
        )}
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Protection JWT & Cookies</h3>
          <p className="text-sm text-gray-600">
            Cookies HTTP-only sécurisés avec sessions utilisateur et authentification GraphQL.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Kanban & Sous-tâches</h3>
          <p className="text-sm text-gray-600">
            Drag and drop interactif, création instantanée de tâches et sous-tâches avec statut.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Logs Backend en Temps Réel</h3>
          <p className="text-sm text-gray-600">
            Flux d&apos;activités en direct via GraphQL Subscriptions (WebSocket) affiché en bas de page.
          </p>
        </div>
      </div>
    </div>
  );
}
