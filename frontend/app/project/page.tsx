'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { CREATE_PROJECT, DELETE_PROJECT } from '@/app/lib/graphql/mutation';
import { GET_MY_PROJECTS } from '@/app/lib/graphql/queries';
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderPlus, Trash2, ArrowRight, Kanban, Plus, ShieldAlert, LogIn } from 'lucide-react';

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: myProjectsData, loading: myProjectsLoading, refetch: refetchProjects } = useQuery(GET_MY_PROJECTS, {
    skip: !user,
  });

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

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Voulez-vous vraiment supprimer ce projet et toutes ses tâches ?')) return;

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
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentification requise</h2>
          <p className="text-gray-600 text-sm mb-6">
            Vous devez être connecté pour accéder à vos projets personnels et gérer vos tâches.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow transition text-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-xl shadow-xs transition text-sm cursor-pointer"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Projets</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user ? `Connecté en tant que ${user.name} (${user.email})` : 'Chargement...'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire création de projet */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-indigo-600 font-semibold text-lg">
              <FolderPlus className="w-5 h-5" />
              <h2>Nouveau Projet</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Nom du projet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Refonte Application Mobile"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Création en cours...' : 'Créer le projet'}
              </button>
            </form>
          </div>
        </div>

        {/* Liste des projets de l'utilisateur */}
        <div className="lg:col-span-2">
          {myProjectsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProjects.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/kanban?projectId=${project.id}`)}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                        <Kanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {project.tasks?.length || 0} tâche(s)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Supprimer le projet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                    <span>Ouvrir le Kanban</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8">
              <Kanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Vous n&apos;avez aucun projet pour le moment</p>
              <p className="text-gray-400 text-sm mt-1">Créez votre premier projet via le formulaire à gauche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
