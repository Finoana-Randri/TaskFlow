'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { LogOut, LayoutDashboard, CheckSquare, Sparkles, FolderKanban } from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Left Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:bg-indigo-700 transition-colors duration-200">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-zinc-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  TaskFlow
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                  GraphQL
                </span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/project"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                pathname.startsWith('/project') || pathname.startsWith('/kanban')
                  ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <span>Tableaux & Projets</span>
            </Link>
          </nav>
        </div>

        {/* Right Nav / Auth Controls */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/project"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 text-xs text-zinc-700 font-medium transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Mes Projets</span>
              </Link>

              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-zinc-900 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-transparent transition cursor-pointer ml-1"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Quitter</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 rounded-lg hover:bg-zinc-100 transition"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-xs hover:shadow-sm transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Créer un compte</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
