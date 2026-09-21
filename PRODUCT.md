# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Utilisateurs authentifiés qui veulent organiser leurs projets personnels ou d’équipe dans un tableau visuel et léger.

## Product Purpose

TaskFlow permet de créer des projets, de suivre les tâches dans un tableau Kanban, de les déplacer selon l’avancement et de garder les documents utiles au même endroit. Le succès se mesure par une organisation rapide, lisible et adaptée à chaque projet.

## Positioning

Le tableau reste flexible : chaque projet peut définir ses propres colonnes et associer plusieurs pièces jointes directement aux tâches, avec aperçu depuis le tableau.

## Operating Context

L’utilisateur crée ou ouvre un projet, ajoute des tâches, les déplace par glisser-déposer, ajoute des sous-tâches et rattache des images, PDF ou documents aux cartes. Une connexion est nécessaire pour accéder aux projets personnels.

## Capabilities and Constraints

- Stack existante : Next.js App Router, React, TypeScript, Apollo/GraphQL, Express, Prisma et PostgreSQL.
- Les projets, colonnes, tâches, sous-tâches et pièces jointes sont isolés par utilisateur authentifié.
- Les colonnes par défaut sont « À faire », « En cours » et « Terminé », mais le produit doit permettre des colonnes supplémentaires propres à chaque projet.
- Les pièces jointes sont téléversées par le serveur, limitées à 25 Mo dans l’implémentation actuelle, et les images/PDF doivent être visualisables dans l’application.
- Les logs techniques temps réel existent côté tableau mais ne doivent pas dominer la présentation d’accueil.

## Brand Commitments

Le nom visible du produit est TaskFlow. L’interface doit rester en français, claire, accueillante et moderne. Les détails d’implémentation (JWT, GraphQL, endpoints et logs internes) ne doivent pas être présentés comme bénéfices sur l’accueil.

## Evidence on Hand

- Illustrations SVG existantes dans `frontend/public/illustrations/` pour le tableau, les colonnes, les documents et l’activité temps réel.
- Schéma Prisma et résolveurs existants pour les colonnes et les pièces jointes.
- Aucun témoignage, logo client ou métrique commerciale fournis : ne pas en inventer.

## Product Principles

- L’organisation doit s’adapter au projet, pas l’inverse.
- L’information utile reste près de la tâche.
- Les actions principales doivent être compréhensibles sans vocabulaire technique.
- La lisibilité et la confiance passent avant la densité de fonctionnalités.

## Accessibility & Inclusion

Conserver une navigation clavier utilisable, des libellés explicites, des états de chargement et d’erreur compréhensibles, ainsi qu’une mise en page responsive pour petits écrans.
