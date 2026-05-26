# EasyInventory

EasyInventory est une application de gestion d'inventaire concue pour les equipes terrain, les responsables de stock et les directions operationnelles. Le projet contient l'historique Appsmith original ainsi qu'une application web Next.js moderne permettant de tester et faire evoluer l'experience produit dans un environnement local.

L'objectif est simple: offrir une interface claire pour retrouver un article, controler son statut, documenter ses photos, suivre ses changements et garder une vision fiable des lieux de stockage.

## Documentation utilisateurs finaux

Le guide principal pour les utilisateurs est disponible ici:

- [`docs/user-guide.md`](docs/user-guide.md)

Ce guide explique comment utiliser EasyInventory au quotidien: tableau de bord, recherche, inventaire, fiche article, photos, statuts, logs, lieux, roles, routines de controle, bonnes pratiques et questions frequentes.

## Fonctionnalites principales

- Tableau de bord avec indicateurs globaux, filtre par lieu, repartition par statut et actions recentes.
- Graphique Statut avec deux modes: Lines et Camembert.
- Inventaire sous forme de cartes avec recherche globale, filtres, tri, badges de statut et indication des photos manquantes.
- Fiche article detaillee avec edition des champs, galerie photo, photo principale et historique.
- Page Logs dediee aux actions recentes avec navigation directe vers l'article concerne.
- Page Documentation client accessible depuis l'interface.
- Gestion des lieux: creation, edition, activation et desactivation.
- Gestion des roles: owner, admin, manager et operator.
- Mode demo local persistant dans le navigateur.
- Theme clair/sombre et interface multilingue FR, EN, ES.

## Stack technique

- Next.js 16 avec App Router.
- React 19.
- TypeScript.
- CSS global avec variables de theme.
- Vitest pour les tests unitaires metier.
- Drizzle ORM et schema SQL pour la preparation backend.
- Docker Compose pour lancer les services locaux utiles au developpement.

## Structure du depot

```text
.
|-- apps/
|   `-- web/                     Application Next.js
|       |-- src/app/             Routes App Router
|       |-- src/components/      Composants UI et vues metier
|       |-- src/lib/             Types, logique inventaire, seed, i18n, permissions
|       |-- src/styles/          Styles globaux
|       `-- src/test/            Tests Vitest
|-- datasources/                 Export Appsmith des sources de donnees
|-- docs/                        Specifications fonctionnelles
|-- pages/                       Export Appsmith des pages, widgets, queries et JSObjects
|-- docker-compose.yml           Services locaux
|-- application.json             Metadata Appsmith
`-- theme.json                   Theme Appsmith
```

## Demarrage local

Depuis le dossier de l'application web:

```bash
cd apps/web
npm install
npm run dev
```

L'application est ensuite disponible sur:

```text
http://localhost:3000
```

Le mode demo fonctionne sans secrets. Les changements sont sauvegardes dans le `localStorage` du navigateur afin de permettre une validation rapide des parcours.

## Scripts utiles

Depuis `apps/web`:

```bash
npm run dev
npm run typecheck
npm run test
npm run build
```

- `npm run dev` lance le serveur de developpement.
- `npm run typecheck` verifie TypeScript sans generer de build.
- `npm run test` execute les tests Vitest.
- `npm run build` valide le build de production Next.js.

## Routes web

- `/` ouvre le tableau de bord.
- `/inventory` ouvre directement l'inventaire.
- `/logs` ouvre le journal complet des actions recentes.
- `/documentation` ouvre la documentation client integree.

## Parcours utilisateur

### Tableau de bord

Le tableau de bord sert de point d'entree operationnel. Il permet de:

- consulter le nombre total d'articles;
- identifier les articles sans photo principale;
- compter les lieux actifs;
- filtrer les indicateurs par lieu;
- visualiser la repartition par statut en Lines ou Camembert;
- ouvrir la page Logs depuis Actions recentes.

La repartition par statut respecte les valeurs a zero: une categorie sans article reste visible dans la liste, mais sa barre est vide afin de ne pas donner une impression de volume.

### Inventaire

La page Inventaire affiche les articles sous forme de cartes. Chaque carte contient:

- le tag article;
- la photo principale ou une indication de photo manquante;
- le nom;
- le statut;
- les notes ou la categorie;
- le lieu;
- la derniere action connue.

La recherche globale couvre les tags, noms, categories, statuts, lieux, notes et informations d'action. Les filtres permettent de reduire la liste par lieu, statut ou categorie. Le tri permet de classer par recence, tag, nom, statut ou lieu.

### Fiche article

La fiche article regroupe les operations principales:

- modification du nom;
- modification du tag;
- modification de la categorie;
- changement de lieu;
- edition des notes;
- changement de statut;
- ajout de photos;
- definition de la photo principale;
- desactivation de photos;
- consultation de l'historique de l'article.

Chaque modification importante ajoute une entree dans le journal d'actions.

### Logs

La page Logs donne une vue chronologique des actions recentes. Elle affiche:

- le libelle de l'action;
- l'article concerne;
- le lieu;
- le role acteur;
- la date et l'heure.

Un clic sur une ligne ramene directement vers l'article correspondant dans l'inventaire.

### Lieux

La page Lieux sert a maintenir les emplacements physiques ou logiques. Un lieu peut etre renomme, annote, active ou desactive. Les lieux inactifs restent utiles pour l'historique, mais ils ne sont plus traites comme des lieux actifs dans les vues principales.

### Documentation client

La page Documentation est integree dans la navigation principale. Elle explique les ecrans, les controles, les roles et la routine conseillee pour garder l'inventaire fiable.

## Roles et permissions

Les roles structurent les droits de modification:

- `owner`: acces complet, y compris reinitialisation demo.
- `admin`: acces complet hors responsabilites proprietaire specifiques.
- `manager`: gestion operationnelle des articles, lieux et photos.
- `operator`: actions terrain limitees aux notes, statuts et photos.

Les controles non autorises sont desactives dans l'interface afin d'eviter les erreurs et de rendre les limites visibles.

## Donnees demo

Les donnees de demonstration sont definies dans:

```text
apps/web/src/lib/seed.ts
```

Elles couvrent:

- une organisation;
- plusieurs lieux;
- des articles avec statuts differents;
- des photos principales et secondaires;
- un journal d'actions initial.

La logique metier principale se trouve dans:

```text
apps/web/src/lib/inventory.ts
```

Elle contient notamment la synthese dashboard, la recherche, le tri, la creation d'article, l'edition d'article, l'ajout de photos, la selection de photo principale et la desactivation de photos.

## Verification avant livraison

Avant de livrer une modification, executer:

```bash
cd apps/web
npm run typecheck
npm run test
npm run build
```

Controle visuel recommande:

- ouvrir le tableau de bord;
- verifier les deux modes du graphique Statut;
- verifier qu'un statut a zero reste visuellement a zero;
- ouvrir l'inventaire et controler les fondus des images;
- ouvrir une fiche article et controler la photo principale;
- cliquer sur Actions recentes et verifier la page Logs;
- ouvrir la Documentation depuis la navigation;
- tester les vues en largeur mobile et desktop.

## Docker

Depuis la racine du depot:

```bash
docker compose up --build
```

Le fichier `docker-compose.yml` permet de lancer l'environnement local complet lorsque les services externes sont necessaires.

## Documentation fonctionnelle existante

Le dossier `docs/` contient les guides et specifications:

- [`docs/user-guide.md`](docs/user-guide.md)
- [`docs/dashboard-feature.md`](docs/dashboard-feature.md)

## Bonnes pratiques de contribution

- Travailler sur une branche dediee.
- Garder les changements scopes a la fonctionnalite demandee.
- Ajouter ou adapter les tests lorsque la logique metier change.
- Verifier TypeScript, tests et build avant ouverture de pull request.
- Ne pas supprimer les exports Appsmith sans besoin explicite.
- Documenter les changements visibles dans ce README ou dans `docs/` lorsque la fonctionnalite devient structurante.

## Statut du projet

EasyInventory est en phase de consolidation produit. L'application web sert de base moderne pour rendre les parcours utilisables, documentes et testables, tout en conservant le contexte Appsmith existant dans le depot.
