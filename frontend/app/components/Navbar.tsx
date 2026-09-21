'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { ArrowUpRight, CheckSquare, FolderKanban, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="site-navbar sticky top-0 z-40 w-full">
      <div className="site-navbar__inner mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="TaskFlow, accueil">
            <span className="site-brand__mark flex h-9 w-9 items-center justify-center rounded-[13px] transition-transform duration-200 group-hover:-rotate-3">
              <CheckSquare className="h-[18px] w-[18px] stroke-[2.5]" />
            </span>
            <span className="site-brand__name text-[1.05rem] font-bold tracking-[-0.03em]">TaskFlow</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            <Link
              href="/project"
              className={`site-navbar__link inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                pathname.startsWith('/project') || pathname.startsWith('/kanban')
                  ? 'is-active'
                  : ''
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              <span>Mes tableaux</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#17181b] border-t-transparent" aria-label="Chargement" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/project"
                className="hidden items-center gap-2 rounded-full border border-[#d8d0c5] bg-[#fbf8f2] px-3 py-2 text-xs font-semibold text-[#5d5b57] transition hover:border-[#17181b] hover:text-[#17181b] sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-[#ef6b54]" />
                <span>Mes projets</span>
              </Link>
              <div className="site-account flex items-center gap-2 pl-2.5">
                <span className="site-account__avatar flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                  {getInitials(user.name)}
                </span>
                <div className="site-account__details hidden max-w-[130px] leading-tight sm:block">
                  <span className="site-account__name block truncate text-xs font-bold">{user.name}</span>
                  <span className="site-account__email block truncate text-[10px]">{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="site-navbar__logout inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold transition"
                title="Se déconnecter"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Quitter</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="site-navbar__login rounded-full px-3.5 py-2 text-sm font-semibold transition">
                Connexion
              </Link>
              <Link
                href="/register"
                className="site-navbar__cta inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition"
              >
                <span>Créer un compte</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
