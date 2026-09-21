'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { CREATE_PROJECT, DELETE_PROJECT } from '@/app/lib/graphql/mutation';
import { GET_MY_PROJECTS } from '@/app/lib/graphql/queries';
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderPlus,
  Trash2,
  ArrowRight,
  Kanban,
  Plus,
  ShieldAlert,
  LogIn,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: myProjectsData, loading: myProjectsLoading, refetch: refetchProjects } = useQuery(
    GET_MY_PROJECTS,
    {
      skip: !user,
    }
  );

  const [createProject] = useMutation(CREATE_PROJECT);
  const [deleteProject] = useMutation(DELETE_PROJECT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!user) {
      alert('Veuillez vous connecter pour créer un projet.');
      router.push('/login');
      return;
    }

    setCreating(true);
    try {
      const response = await createProject({
        variables: {
          name: name.trim(),
        },
      });
      const projectId = response.data?.createProject?.id;
      setName('');
      await refetchProjects();
      if (projectId) {
        router.push(`/kanban?projectId=${projectId}`);
      }
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la création du projet');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Supprimer définitivement le projet "${projectName}" et toutes ses tâches associées ?`)) {
      return;
    }

    try {
      await deleteProject({
        variables: { id: parseInt(projectId, 10) },
      });
      await refetchProjects();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression');
    }
  };

  if (!user && !authLoading) {
    return (
      <div className="project-page max-w-none px-4 py-20 text-center">
        <div className="access-card max-w-md mx-auto p-8 rounded-3xl border text-center">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Accès restreint</h2>
          <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
            Vous devez être connecté avec votre compte pour accéder à vos tableaux de bord et gérer vos tâches.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-xs transition text-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 font-medium px-5 py-2.5 rounded-xl shadow-2xs transition text-sm cursor-pointer"
            >
              <span>Créer un compte</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const myProjects = myProjectsData?.myProjects || [];

  return (
    <div className="project-page max-w-none px-4 sm:px-6 lg:px-8 py-8 md:py-10 w-full flex-1">
      {/* Header Section */}
      <div className="project-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Mes Projets</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {myProjects.length} {myProjects.length > 1 ? 'projets' : 'projet'}
            </span>
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm">
            {user ? `Connecté en tant que ${user.name} (${user.email})` : 'Chargement de la session...'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Creation Form (Left Sidebar) */}
        <div className="lg:col-span-1">
          <div className="project-create-card bg-white p-6 rounded-2xl border sticky top-24">
            <div className="flex items-center gap-2.5 mb-4 text-zinc-900 font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FolderPlus className="w-4 h-4" />
              </div>
              <h2>Créer un nouveau projet</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Nom du projet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Sprint Refonte Produit"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl shadow-xs hover:shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                {creating ? 'Création...' : 'Créer et ouvrir'}
              </button>
            </form>
          </div>
        </div>

        {/* Projects Grid (Right Content) */}
        <div className="lg:col-span-2">
          {myProjectsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-zinc-500">Chargement de vos projets...</p>
            </div>
          ) : myProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myProjects.map((project: any) => {
                const taskCount = project.tasks?.length || 0;
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/kanban?projectId=${project.id}`)}
                    className="project-card bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
                          <Kanban className="w-5 h-5" />
                        </div>

                        <button
                          onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                          className="danger-control opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Supprimer le projet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="project-card__title font-bold text-zinc-900 transition-colors text-base line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{taskCount} {taskCount > 1 ? 'tâches enregistrées' : 'tâche enregistrée'}</span>
                      </p>
                    </div>

                    <div className="brand-accent mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold">
                      <span>Ouvrir le Kanban</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="project-empty text-center py-16 bg-white rounded-3xl border border-dashed p-8">
              <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <Kanban className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-800">Aucun projet créé pour l&apos;instant</h3>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                Commencez par créer votre premier projet avec le formulaire pour organiser vos tâches en Kanban.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
