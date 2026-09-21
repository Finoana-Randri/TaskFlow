'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useAuth } from './lib/auth-context';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Paperclip,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';

const meterChannels = [
  {
    name: 'Idées',
    level: 34,
    tone: 'cool',
    tasks: ['Note de cadrage', 'Références visuelles'],
  },
  {
    name: 'En cours',
    level: 68,
    tone: 'warm',
    tasks: ['Prototype accueil', 'Préparer les visuels'],
  },
  {
    name: 'Validation',
    level: 86,
    tone: 'hot',
    tasks: ['Retour équipe', 'Derniers ajustements'],
  },
  {
    name: 'Livré',
    level: 52,
    tone: 'done',
    tasks: ['Brief final', 'Kit de lancement'],
  },
];

function MeterConsole() {
  return (
    <div className="meter-console" aria-label="Aperçu d’un tableau TaskFlow avec des colonnes personnalisées">
      <div className="meter-console__topbar">
        <div className="meter-console__lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="meter-console__live">
          <span />
          En rythme
        </div>
      </div>

      <div className="meter-console__body">
        <div className="meter-console__scale" aria-hidden="true">
          <span>+6</span>
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
        </div>

        <div className="meter-console__channels">
          {meterChannels.map((channel, index) => (
            <div className="meter-channel" key={channel.name}>
              <div className="meter-channel__header">
                <span className={`meter-channel__dot meter-channel__dot--${channel.tone}`} />
                <strong>{channel.name}</strong>
                <span className="meter-channel__count">{index + 2}</span>
              </div>

              <div className="meter-track" aria-hidden="true">
                <div className="meter-track__ticks" />
                <div
                  className={`meter-track__needle meter-track__needle--${channel.tone}`}
                  style={{ '--needle-position': `${channel.level}%` } as CSSProperties}
                />
                <div className="meter-track__zero" />
              </div>

              <div className="meter-channel__tasks">
                {channel.tasks.map((task, taskIndex) => (
                  <div className="meter-task" key={task}>
                    <span className={`meter-task__state ${taskIndex === 0 ? 'is-active' : ''}`}>
                      {taskIndex === 0 && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span>{task}</span>
                    {channel.name === 'Validation' && taskIndex === 0 && <Paperclip className="h-3 w-3" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="meter-console__footer">
        <span><span className="meter-console__footer-mark" /> 4 flux actifs</span>
        <span>12 cartes · 03 fichiers liés</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const primaryHref = user ? '/project' : '/register';

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__glow home-hero__glow--one" aria-hidden="true" />
        <div className="home-hero__glow home-hero__glow--two" aria-hidden="true" />
        <div className="home-shell home-hero__grid">
          <div className="home-hero__copy">
            <div className="home-hero__rule" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h1>
              Un tableau qui suit <span className="home-hero__accent">le mouvement</span> réel de votre projet.
            </h1>
            <p>
              Organisez les étapes qui vous ressemblent, gardez les idées en mouvement et retrouvez chaque document au bon endroit — directement sur la tâche qui compte.
            </p>
            <div className="home-hero__actions">
              {loading ? (
                <span className="home-button home-button--dark home-button--loading">Chargement…</span>
              ) : (
                <Link href={primaryHref} className="home-button home-button--signal">
                  <span>{user ? 'Ouvrir mes tableaux' : 'Créer mon espace'}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              {!user && (
                <Link href="/login" className="home-text-link">
                  Déjà un compte <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

          </div>

          <div className="home-hero__visual">
            <div className="home-hero__visual-frame">
              <MeterConsole />
            </div>
            <div className="home-hero__visual-caption">
              <span>TABLEAU / VUE ACTIVE</span>
              <span>glisser · déposer · avancer</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section--intro">
        <div className="home-shell">
          <div className="home-section__heading">
            <div>
              <h2>Votre méthode mérite mieux qu’une liste figée.</h2>
            </div>
            <p>
              Un projet n’avance jamais de la même façon. Ajoutez une étape de revue, de test ou de validation sans perdre le fil — puis attachez les éléments qui donnent du sens à chaque carte.
            </p>
          </div>

          <div className="home-feature-layout">
            <article className="home-feature home-feature--columns">
              <div className="home-feature__copy">
                <div className="home-feature__icon"><LayoutGrid className="h-4 w-4" /></div>
                <h3>Des colonnes à votre tempo</h3>
                <p>Créez autant d’étapes que votre projet en demande : recherche, revue, test, livraison ou tout ce qui vous aide à voir le prochain mouvement.</p>
                <span className="home-feature__trail">Personnaliser le flux <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
              <div className="home-feature__image home-feature__image--columns">
                <Image src="/illustrations/columns-feature.svg" width={400} height={300} alt="Colonnes personnalisées dans un tableau" />
              </div>
            </article>

            <article className="home-feature home-feature--subtasks">
              <div className="home-feature__stripe" aria-hidden="true" />
              <div className="home-feature__icon"><SlidersHorizontal className="h-4 w-4" /></div>
              <h3>Le détail reste à portée de main.</h3>
              <p>Découpez une tâche, suivez son avancée et gardez le contexte là où il est utile.</p>
              <div className="home-checklist" aria-label="Exemple de sous-tâches">
                <span><span className="home-checklist__box is-done"><Check className="h-3 w-3" /></span>Rassembler les références</span>
                <span><span className="home-checklist__box" />Relire le contenu</span>
                <span><span className="home-checklist__box" />Partager pour validation</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section home-section--documents">
        <div className="home-shell home-document-grid">
          <div className="home-document-visual">
            <div className="home-document-visual__label"><Paperclip className="h-3.5 w-3.5" /> PIÈCES JOINTES</div>
            <Image src="/illustrations/documents-feature.svg" width={400} height={300} alt="Aperçu de documents attachés à une tâche" />
            <div className="home-document-visual__stamp"><FileText className="h-4 w-4" /> aperçu instantané</div>
          </div>
          <div className="home-document-copy">
            <h2>Une photo, un PDF ou un document : tout reste au même endroit.</h2>
            <p>
              Téléversez plusieurs fichiers sur une carte, ouvrez-les sans quitter le tableau et gardez les bonnes références visibles quand le travail passe d’une étape à l’autre.
            </p>
            <div className="home-file-types">
              <span><ImageIcon className="h-4 w-4" /> Images</span>
              <span><FileText className="h-4 w-4" /> PDF</span>
              <span><Paperclip className="h-4 w-4" /> Documents</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-closing">
        <div className="home-shell home-closing__inner">
          <div>
            <div className="home-closing__mark" aria-hidden="true"><Plus className="h-5 w-5" /></div>
            <h2>Le prochain mouvement commence ici.</h2>
            <p>Créez un projet, trouvez votre rythme et faites avancer le travail sans le disperser.</p>
          </div>
          <Link href={primaryHref} className="home-button home-button--light">
            <span>{user ? 'Voir mes projets' : 'Commencer maintenant'}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
