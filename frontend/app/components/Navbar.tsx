'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { LogOut, User as UserIcon, LayoutDashboard, PlusCircle, CheckSquare } from 'lucide-react';

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
            <CheckSquare className="w-6 h-6" />
            <span>TaskFlow GraphQL</span>
          </Link>

          <nav className="hidden md:flex space-x-4">
            <Link
              href="/project"
              className="text-gray-700 hover:text-indigo-600 font-medium text-sm flex items-center gap-1 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Projets
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-800">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                <span>{user.name}</span>
                <span className="text-xs text-gray-500 hidden sm:inline">({user.email})</span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg shadow transition"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
