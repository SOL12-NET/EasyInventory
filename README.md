# EasyInventory

EasyInventory est une application de gestion d'inventaire pensee pour les equipes terrain, les responsables de stock et les managers operationnels.

Elle permet de savoir rapidement ou se trouve chaque article, dans quel etat il est, quelles photos le documentent, quelles actions ont ete faites recemment et quelles fiches doivent encore etre completees.

Ce README est le guide principal pour les utilisateurs finaux.

## Sommaire

- [A quoi sert EasyInventory](#a-quoi-sert-easyinventory)
- [Les notions importantes](#les-notions-importantes)
- [Navigation generale](#navigation-generale)
- [Tableau de bord](#tableau-de-bord)
- [Inventaire](#inventaire)
- [Fiche article](#fiche-article)
- [Statuts](#statuts)
- [Photos](#photos)
- [Logs et historique](#logs-et-historique)
- [Lieux](#lieux)
- [Roles et permissions](#roles-et-permissions)
- [Routine conseillee](#routine-conseillee)
- [Cas d'usage courants](#cas-dusage-courants)
- [Bonnes pratiques](#bonnes-pratiques)
- [Questions frequentes](#questions-frequentes)
- [Glossaire](#glossaire)
- [Annexe technique](#annexe-technique)

## A quoi sert EasyInventory

EasyInventory sert a garder un inventaire propre, lisible et exploitable par toute l'equipe.

L'application aide a repondre rapidement a ces questions:

- Combien d'articles avons-nous actuellement ?
- Quels articles sont disponibles ?
- Quels articles sont loues, en reparation, vendus, perdus ou en doublon ?
- Quels articles n'ont pas encore de photo principale ?
- Ou se trouve un article precis ?
- Qui a modifie un statut, une note, une photo ou une localisation ?
- Quelles actions recentes doivent etre verifiees ?
- Quels lieux sont actifs ?

L'objectif n'est pas seulement de stocker une liste d'articles. L'objectif est de donner une vision operationnelle fiable, utilisable pendant les controles terrain, les retours de materiel, les preparations d'evenement, les locations, les reparations et les arbitrages de stock.

## Les notions importantes

### Article

Un article est un objet suivi dans l'inventaire. Il possede un tag, un nom, une categorie, un statut, un lieu, des notes et parfois des photos.

### Tag

Le tag est l'identifiant court de l'article. Il sert a retrouver rapidement un article, surtout pendant un controle physique.

Exemple: `1001`, `1002`, `1003`.

### Statut

Le statut indique l'etat operationnel de l'article:

- Disponible
- Loue
- Reparation
- Vendu
- Perdu
- Doublon

### Lieu

Le lieu indique ou se trouve l'article ou ou il est affecte. Il peut s'agir d'un depot, d'un showroom, d'un atelier, d'une agence, d'une zone de retour ou d'un site client.

### Photo principale

La photo principale est l'image qui represente l'article dans les cartes d'inventaire. Elle doit permettre d'identifier l'article rapidement, meme sans lire les details.

### Logs

Les logs sont le journal des actions recentes. Ils permettent de comprendre ce qui a ete modifie, quand, sur quel article et par quel role.

## Navigation generale

La navigation principale se trouve sur le cote gauche de l'application.

### Tableau de bord

Vue globale de l'inventaire: indicateurs, statuts, lieux et actions recentes.

### Inventaire

Liste complete des articles avec recherche, filtres, tri, cartes et fiche detaillee.

### Logs

Journal complet des actions recentes. Cette page permet de retrouver rapidement les changements importants.

### Documentation

Aide integree dans l'application pour comprendre l'interface et les bonnes pratiques.

### Lieux

Gestion des emplacements: creation, edition, activation et desactivation.

### Organisation

Zone de controle du role courant, des permissions et des options de demonstration.

## Tableau de bord

Le tableau de bord est le point d'entree recommande. Avant de modifier quoi que ce soit, il permet de comprendre l'etat general de l'inventaire.

### Indicateurs principaux

Le tableau de bord affiche plusieurs indicateurs:

- Articles: nombre total d'articles dans le perimetre selectionne.
- Sans photo principale: nombre d'articles qui doivent encore etre documentes visuellement.
- Lieux actifs: nombre de lieux actuellement disponibles.

Un nombre eleve dans "Sans photo principale" signifie que certains articles seront difficiles a identifier rapidement. Il faut les traiter en priorite lors d'une campagne de mise a jour.

### Filtre de lieu

Le filtre de lieu permet de concentrer les indicateurs sur un site precis.

Utilisez-le lorsque vous voulez:

- controler un depot;
- verifier un showroom;
- preparer une operation locale;
- suivre un atelier de reparation;
- analyser les articles d'un site client.

Selectionnez "Tous les lieux" pour revenir a la vue globale.

### Graphique Statut

Le bloc Statut montre la repartition des articles par statut.

Deux modes sont disponibles:

- Lines: comparaison en barres horizontales.
- Camembert: repartition circulaire globale.

Le mode Lines est utile pour comparer rapidement les volumes. Le mode Camembert est utile pour comprendre la repartition d'ensemble.

Important: lorsqu'un statut vaut zero, il reste affiche mais sa barre est vide. Cela evite de donner l'impression qu'il existe un volume alors qu'il n'y en a pas.

### Actions recentes

Le bloc Actions recentes affiche les dernieres actions importantes.

Cliquez sur "Actions recentes" ou sur "Voir tout" pour ouvrir la page Logs complete.

Cette zone sert a verifier rapidement ce qui vient de changer:

- creation d'article;
- modification de statut;
- ajout de photo;
- changement de photo principale;
- modification de nom;
- modification de notes;
- changement de lieu.

## Inventaire

La page Inventaire est la zone principale de travail. Elle permet de chercher, filtrer, consulter et modifier les articles.

### Comprendre une carte article

Chaque carte affiche les informations essentielles:

- photo principale ou indication de photo manquante;
- tag;
- nom;
- statut;
- note courte ou categorie;
- lieu;
- derniere action connue.

Si une carte affiche "Sans photo principale", l'article doit etre complete. Une photo principale facilite l'identification terrain et reduit les erreurs.

### Recherche globale

La recherche globale permet de retrouver un article avec plusieurs types d'informations.

Vous pouvez chercher par:

- tag;
- nom;
- lieu;
- statut;
- categorie;
- notes;
- type d'action recente;
- role acteur.

Exemples:

- `1001` pour retrouver un article par tag.
- `cafe` pour retrouver une machine a cafe.
- `Annecy` pour retrouver les articles d'un lieu.
- `reparation` pour voir les articles concernes.
- `manager` pour retrouver des actions associees a ce role.

### Filtres

Les filtres reduisent la liste d'articles.

Filtres disponibles:

- Lieux: affiche uniquement les articles d'un lieu.
- Statut: affiche uniquement les articles d'un statut.
- Categorie: affiche uniquement une famille d'articles.

Les filtres peuvent etre combines. Par exemple, vous pouvez afficher uniquement les articles en reparation dans le lieu de Lyon.

### Tri

Le tri change l'ordre d'affichage:

- Recents: articles modifies le plus recemment.
- Tag: classement par numero de tag.
- Nom: classement alphabetique.
- Statut: regroupement par statut.
- Lieu: regroupement par emplacement.

Pour un controle physique, le tri par tag est souvent le plus pratique. Pour un suivi manager, le tri par recence est souvent plus pertinent.

## Fiche article

Lorsque vous selectionnez une carte, la fiche detaillee de l'article s'ouvre.

Elle centralise:

- la photo principale;
- la galerie;
- les informations modifiables;
- les statuts;
- l'historique de l'article.

### Champs modifiables

Selon votre role, vous pouvez modifier:

- Nom
- Tag
- Categorie
- Lieu
- Notes
- Statut

Chaque modification importante ajoute une trace dans l'historique.

### Bien nommer un article

Un bon nom doit etre court, clair et reconnaissable.

Bons exemples:

- `Machine a cafe mobile`
- `Table pliante XL`
- `Perceuse sans fil`
- `Lot rallonges electriques`

Noms a eviter:

- `materiel`
- `objet`
- `stock`
- `divers`
- `truc`

Un nom trop vague rend la recherche difficile et augmente le risque de doublon.

### Bien utiliser les notes

Les notes doivent contenir des informations utiles pour l'exploitation.

Exemples de bonnes notes:

- `Kit complet, prevoir capsules.`
- `Batterie a remplacer.`
- `Louee pour evenement client.`
- `Controle effectue le mois dernier.`
- `Manque cable alimentation.`

Les notes doivent rester factuelles. Evitez les commentaires trop anciens, non verifies ou ambigus.

## Statuts

Le statut indique l'etat operationnel de l'article. Il doit etre mis a jour des qu'un article change de situation.

### Disponible

L'article peut etre utilise, loue ou affecte. C'est le statut normal pour un article pret.

Avant de passer un article en Disponible, assurez-vous qu'il est physiquement present, complet et utilisable.

### Loue

L'article est sorti ou affecte a un client, un evenement ou une equipe.

Avant de remettre l'article en Disponible, verifiez qu'il est revenu et que son etat est correct.

### Reparation

L'article ne doit pas etre utilise tant qu'une intervention est necessaire.

Ajoutez une note claire pour expliquer le probleme:

- piece manquante;
- batterie defectueuse;
- casse visible;
- controle necessaire;
- nettoyage a faire;
- test a refaire.

### Vendu

L'article n'est plus disponible car il a ete vendu.

Ce statut permet de conserver une trace historique sans compter l'article comme disponible.

### Perdu

L'article est introuvable ou non restitue.

Utilisez ce statut apres verification terrain. Ajoutez une note avec le contexte connu.

### Doublon

L'article correspond a une fiche creee par erreur ou a un article deja represente ailleurs.

Avant d'utiliser ce statut, verifiez:

- le tag;
- le nom;
- les photos;
- le lieu;
- les actions recentes.

## Photos

Les photos sont essentielles pour identifier rapidement les articles et eviter les confusions.

### Photo principale

La photo principale est celle qui apparait sur la carte article.

Une bonne photo principale:

- montre l'article entier;
- est nette;
- n'est pas trop sombre;
- ne contient pas trop d'objets parasites;
- permet de reconnaitre l'article sans lire le nom.

### Ajouter des photos

Depuis la fiche article, utilisez le bouton d'ajout de photos.

Ajoutez plusieurs photos si:

- l'article a plusieurs faces importantes;
- un accessoire doit etre visible;
- un defaut doit etre documente;
- le contenu d'un lot doit etre verifie;
- l'article est difficile a reconnaitre avec une seule image.

### Definir la photo principale

Dans la galerie, choisissez la photo la plus representative et definissez-la comme principale.

Si une carte indique "Sans photo principale", ouvrez la fiche et ajoutez ou selectionnez une photo principale.

### Desactiver une photo

Desactivez une photo lorsqu'elle est:

- floue;
- incorrecte;
- obsolete;
- liee au mauvais article;
- inutile pour l'identification.

Une photo desactivee ne doit plus representer l'article.

## Logs et historique

La page Logs rassemble les actions recentes dans une vue unique.

Chaque ligne indique:

- l'action effectuee;
- l'article concerne;
- le lieu;
- le role acteur;
- la date et l'heure.

Cliquez sur une ligne pour revenir directement a l'article dans l'inventaire.

Utilisez les Logs pour:

- verifier les modifications recentes;
- comprendre pourquoi un article a change de statut;
- identifier les ajouts de photos;
- suivre les corrections faites par l'equipe;
- reconstituer une sequence d'actions;
- detecter une modification inhabituelle.

## Lieux

Les lieux representent les emplacements physiques ou logiques de votre inventaire.

Exemples:

- `Annecy`
- `Geneve`
- `Lyon`
- `Atelier reparation`
- `Zone retours`
- `Showroom Paris`

### Creer un lieu

Depuis la page Lieux, renseignez un nom clair et des notes utiles.

Un bon nom de lieu doit etre compris par toute l'equipe. Evitez les abreviations obscures ou les noms temporaires.

### Desactiver un lieu

Desactivez un lieu lorsqu'il n'est plus utilise.

Les donnees restent conservees pour l'historique, mais le lieu n'est plus considere comme actif.

Ne desactivez pas un lieu uniquement parce qu'il est temporairement vide. Gardez-le actif s'il peut encore recevoir des articles.

## Roles et permissions

Les roles limitent les actions possibles. Si un bouton est desactive, le role courant n'a probablement pas l'autorisation necessaire.

### Owner

Role le plus complet. Il peut gerer l'ensemble de l'application et reinitialiser la demonstration.

### Admin

Role complet pour l'administration courante.

### Manager

Role adapte au pilotage operationnel. Il peut gerer les articles, les lieux, les photos et les statuts.

### Operator

Role terrain. Il intervient sur les informations operationnelles selon les droits configures, notamment les notes, les statuts et les photos.

## Routine conseillee

Pour garder l'inventaire fiable, suivez cette routine regulierement.

1. Ouvrir le Tableau de bord.
2. Verifier le nombre d'articles sans photo principale.
3. Filtrer par lieu si vous travaillez sur un site precis.
4. Controler les statuts sensibles: Reparation, Perdu, Doublon.
5. Ouvrir l'Inventaire pour corriger les fiches incompletes.
6. Ajouter ou definir les photos principales manquantes.
7. Mettre a jour les notes lorsque le contexte terrain change.
8. Ouvrir les Logs pour verifier les actions recentes.

Cette routine peut etre faite en debut de journee, en fin de journee ou avant une operation importante.

## Cas d'usage courants

### Retrouver rapidement un article

1. Ouvrez Inventaire.
2. Saisissez le tag ou une partie du nom.
3. Verifiez la carte correspondante.
4. Ouvrez la fiche pour consulter le lieu, les notes et les photos.

### Preparer une verification de stock par lieu

1. Ouvrez Tableau de bord.
2. Selectionnez le lieu a controler.
3. Regardez les indicateurs et les statuts.
4. Ouvrez Inventaire.
5. Filtrez sur le meme lieu.
6. Triez par tag pour faciliter le controle physique.

### Traiter les articles sans photo principale

1. Ouvrez Tableau de bord.
2. Notez le nombre "Sans photo principale".
3. Ouvrez Inventaire.
4. Recherchez les cartes marquees "Sans photo principale".
5. Ouvrez chaque fiche.
6. Ajoutez une photo ou definissez une photo existante comme principale.

### Suivre les reparations

1. Ouvrez Inventaire.
2. Filtrez le statut sur Reparation.
3. Ouvrez les fiches concernees.
4. Lisez les notes.
5. Ajoutez une note si une action est necessaire.
6. Repassez l'article en Disponible uniquement lorsque l'article est pret.

### Verifier les changements recents

1. Ouvrez Logs.
2. Lisez les actions les plus recentes.
3. Cliquez sur une ligne si vous devez verifier l'article.
4. Controlez la fiche article et son historique.

### Corriger un doublon

1. Recherchez les deux fiches qui semblent representer le meme article.
2. Comparez les tags, noms, lieux, photos et historiques.
3. Gardez la fiche la plus fiable.
4. Marquez l'autre fiche en Doublon.
5. Ajoutez une note explicite si necessaire.

## Bonnes pratiques

- Ajouter une photo principale lorsqu'un article est cree.
- Utiliser des noms simples et coherents.
- Garder les notes factuelles et utiles.
- Mettre a jour le statut des qu'un article change d'etat.
- Utiliser le statut Reparation avant qu'un article defectueux soit reutilise.
- Utiliser le statut Perdu uniquement apres verification.
- Consulter les Logs apres une serie de modifications.
- Desactiver les lieux obsoletes plutot que les renommer pour un autre usage.
- Verifier les doublons avant de creer un nouvel article.
- Controler regulierement les articles sans photo principale.

## Erreurs a eviter

- Creer plusieurs fiches pour le meme article.
- Laisser un article sans photo principale.
- Marquer un article Disponible alors qu'il est encore chez un client.
- Utiliser les notes pour des informations trop anciennes ou non verifiees.
- Desactiver une photo correcte par erreur.
- Renommer un lieu historique pour representer un nouveau lieu sans lien.
- Changer un statut sans ajouter de note lorsque le contexte est important.
- Utiliser Doublon sans verifier les informations de base.

## Questions frequentes

### Je ne trouve pas un article

Essayez de chercher par tag, nom partiel, lieu, categorie ou statut. Si vous ne trouvez toujours rien, verifiez les Logs pour voir si l'article a ete renomme, deplace ou modifie.

### Un bouton est desactive

Votre role ne permet probablement pas cette action. Demandez a un manager, admin ou owner de faire la modification, ou de changer votre role si cela correspond a votre responsabilite.

### Un article affiche "Sans photo principale"

L'article n'a pas encore de photo principale. Ouvrez la fiche article, ajoutez une photo ou choisissez une photo existante comme principale.

### Le statut affiche zero dans le tableau de bord

Cela signifie qu'aucun article du perimetre selectionne n'a ce statut. Le statut reste affiche pour conserver une lecture complete.

### Comment savoir qui a fait une modification

Ouvrez la page Logs ou l'historique de la fiche article. Vous verrez le role acteur et la date de l'action.

### Quand utiliser Doublon

Utilisez Doublon lorsqu'une fiche represente un article deja existant ailleurs dans l'inventaire. Verifiez toujours le tag, le nom, les photos et le lieu avant de changer le statut.

### Quand utiliser Perdu

Utilisez Perdu lorsqu'un article est introuvable apres verification. Ajoutez une note avec le dernier contexte connu.

### Quand remettre un article en Disponible

Remettez un article en Disponible uniquement lorsqu'il est revenu, complet, utilisable et correctement documente.

## Glossaire

- Article: objet suivi dans l'inventaire.
- Tag: identifiant court de l'article.
- Statut: etat operationnel de l'article.
- Lieu: emplacement ou affectation de l'article.
- Photo principale: image principale utilisee sur la carte article.
- Galerie: ensemble des photos actives de l'article.
- Logs: journal global des actions recentes.
- Historique: liste des actions associees a un article.
- Role: niveau d'autorisation de l'utilisateur.
- Doublon: fiche qui represente un article deja present ailleurs.

## Support interne

Avant de demander de l'aide, notez:

- le tag de l'article;
- le nom de l'article;
- le lieu concerne;
- l'action que vous essayiez de faire;
- le message ou comportement observe;
- votre role actuel.

Ces informations permettent de comprendre plus vite le probleme et d'eviter les allers-retours.

## Annexe technique

Cette section est destinee aux personnes qui installent ou verifient l'application.

### Structure du depot

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

### Demarrage local

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

### Routes principales

- `/` ouvre le tableau de bord.
- `/inventory` ouvre directement l'inventaire.
- `/logs` ouvre le journal complet des actions recentes.
- `/documentation` ouvre la documentation integree.

### Verification avant livraison

Depuis `apps/web`:

```bash
npm run typecheck
npm run test
npm run build
```

Controle visuel recommande:

- ouvrir le tableau de bord;
- verifier les modes Lines et Camembert;
- verifier qu'un statut a zero reste visuellement a zero;
- ouvrir l'inventaire et controler les fondus des images;
- ouvrir une fiche article et controler la photo principale;
- cliquer sur Actions recentes et verifier la page Logs;
- ouvrir la Documentation depuis la navigation;
- tester les vues en largeur mobile et desktop.

### Docker

Depuis la racine du depot:

```bash
docker compose up --build
```
