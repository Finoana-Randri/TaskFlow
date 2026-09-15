# 🚀 TaskFlow GraphQL – Full-Stack Kanban & Real-Time Logs

Une application de gestion de tâches collaborative et moderne conçue avec **Next.js 15 (App Router)**, **Express**, **Apollo Server & Client (GraphQL)**, **Prisma ORM**, **PostgreSQL** et **GraphQL Subscriptions (WebSocket)**.

---

## 🌟 Fonctionnalités Principales

### 🔐 Authentification & Sécurité Stricte
- **Cookies HTTP-Only & JWT** : Authentification sécurisée par token JWT stocké dans un cookie HTTP-Only avec protection contre les attaques XSS.
- **Isolation stricte par utilisateur** : Un utilisateur authentifié a un accès exclusif à **ses propres projets**. Toute tentative d'accès ou de modification (tâches, sous-tâches, projets) appartenant à un autre utilisateur est systématiquement bloquée avec un refus d'accès.
- **Hachage des mots de passe** : Chiffrement robuste avec `bcryptjs`.
- **Sessions & Contexte Auth** : Context React et hooks Apollo avec `credentials: 'include'`.

### 📋 Tableau Kanban Interactif & Fluide
- **Glisser-Déposer Haute Performance** : Conçu avec `@dnd-kit/core` et `@dnd-kit/sortable`.
- **DragOverlay & Animations douces** : Prévisualisation visuelle fluide pendant le drag avec tilt, ombrage doux et détection de collision hybride (`pointerWithin` + `closestCorners`).
- **Mise à jour Optimiste** : Déplacement instantané de cartes sans scintillement ni latence réseau.
- **Colonnes d'états** : *À faire*, *En cours*, *Terminé*.

### ✅ Gestion des Sous-Tâches (SubTasks)
- **Création rapide** : Ajout de sous-tâches directement depuis la carte de chaque tâche sans quitter le Kanban.
- **Validation en un clic** : Coche/décoche instantanée avec mise à jour du statut.
- **Barre de progression dynamique** : Visualisation du pourcentage de complétion des sous-tâches par tâche.
- **Suppression dédiée**.

### ⚡ Logs Backend en Temps Réel (Streaming WebSocket)
- **GraphQL Subscriptions (`graphql-ws`)** : Diffusion en direct des logs d'activités serveur via WebSocket (`ws://localhost:4000/graphql`).
- **Console interactive intégrée** : Située directement au bas du tableau Kanban avec :
  - Badges colorés par type d'événement (`AUTH`, `CREATE`, `UPDATE`, `DELETE`, `INFO`).
  - Horodatage précis, identifiant de l'auteur et détails de l'action.
  - Contrôles interactifs : Effacer les logs, Pause/Reprise du flux, Plein écran, Réduction.
  - Double canal fiable : Streaming WebSocket en direct + synchronisation périodique de secours.

---

## 🛠️ Architecture & Stack Technique

| Couche | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Apollo Client 3, @dnd-kit, Lucide Icons |
| **Backend** | Node.js, Express, Apollo Server Express 3, graphql-ws, WebSocket (ws), PubSub (graphql-subscriptions) |
| **Base de Données** | PostgreSQL 16 (via Docker Compose) & Prisma ORM |
| **Sécurité** | JSON Web Tokens (JWT), Cookies HTTP-Only, Bcryptjs, CORS sécurisé |

---

## 🚀 Installation & Démarrage Rapide

### 1. Cloner le projet
```bash
git clone git@github.com:Eiji1002/Todo_graphql.git
cd Todo_graphql
```

### 2. Démarrer la Base de Données PostgreSQL
```bash
cd backend
docker compose up -d
```

### 3. Configurer & Lancer le Backend
```bash
# Dans le dossier backend/
# Les variables d'environnement sont définies dans .env (ou copiez .env.example) :
cp .env.example .env

# Installer les dépendances
pnpm install

# Appliquer les migrations Prisma & générer le client
pnpm exec prisma migrate deploy
pnpm exec prisma generate

# Démarrer le serveur backend
pnpm dev
```
> Le serveur GraphQL HTTP est disponible sur `http://localhost:4000/graphql`  
> Le serveur de Souscriptions WebSocket est disponible sur `ws://localhost:4000/graphql`

### 4. Configurer & Lancer le Frontend
```bash
cd ../frontend

# Configurer le fichier .env.local (déjà pré-configuré par défaut) :
cp .env.example .env.local

# Installer les dépendances
pnpm install

# Démarrer l'application Next.js
pnpm dev
```
> L'interface utilisateur est disponible sur `http://localhost:3000`

---

## 📁 Variables d'Environnement

### Backend (`backend/.env`)
```env
PORT=4000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=todo_db
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_db?schema=public"
JWT_SECRET="supersecretjwtkey_for_todo_graphql_app_2026"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URI=ws://localhost:4000/graphql
```

---

## 📊 Schéma GraphQL & Opérations

### Types
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  projects: [Project!]!
}

type Project {
  id: ID!
  name: String!
  user: User!
  userId: Int!
  tasks: [Task!]!
}

type Task {
  id: ID!
  title: String!
  completed: Boolean!
  status: String!
  project: Project!
  projectId: Int!
  subtasks: [SubTask!]!
}

type SubTask {
  id: ID!
  title: String!
  done: Boolean!
  task: Task!
  taskId: Int!
}

type ActivityLog {
  id: ID!
  timestamp: String!
  type: String!
  action: String!
  message: String!
  user: String
  details: String
}
```

### Opérations Principales
- **Auth** : `register(...)`, `login(...)`, `logout`, `me`
- **Projets** : `myProjects`, `createProject(...)`, `deleteProject(...)`
- **Tâches** : `getProjectTasks(...)`, `createTask(...)`, `updateTaskStatus(...)`, `deleteTask(...)`
- **Sous-Tâches** : `createSubTask(...)`, `toggleSubTask(...)`, `deleteSubTask(...)`
- **Logs Temps Réel** : `getRecentLogs`, `subscription { activityLogged { ... } }`

---

## 🧪 Commandes de Vérification & Tests

```bash
# Vérification du build et lint frontend
cd frontend
pnpm run lint
pnpm run build

# Vérification backend
cd ../backend
pnpm dev
```
