# Guide utilisateur EasyInventory

Ce guide explique comment utiliser EasyInventory au quotidien. Il est ecrit pour les utilisateurs finaux: equipes terrain, responsables de stock, managers operationnels et personnes qui doivent consulter l'etat de l'inventaire sans entrer dans la partie technique.

## A quoi sert EasyInventory

EasyInventory sert a garder une vision claire de vos articles: ou ils se trouvent, dans quel etat ils sont, quelles photos les documentent et quelles actions ont ete faites recemment.

L'application aide a repondre rapidement a des questions simples:

- Combien d'articles avons-nous actuellement dans l'inventaire ?
- Quels articles n'ont pas encore de photo principale ?
- Quels articles sont disponibles, loues, en reparation, vendus, perdus ou en doublon ?
- Ou se trouve un article precis ?
- Qui a modifie un statut, une note, une photo ou une localisation ?
- Quelles actions recentes doivent etre verifiees ?

## Les grands principes

Chaque article possede un tag, un nom, une categorie, un statut, un lieu, des notes et eventuellement des photos. La photo principale est celle qui represente l'article dans les cartes d'inventaire.

Chaque modification importante cree une trace dans l'historique. Cela permet de comprendre ce qui s'est passe, quand et par quel role.

Les roles limitent certaines actions. Si un bouton est desactive, cela signifie que le role actuel n'a pas l'autorisation necessaire.

## Demarrer dans l'application

Lorsque vous ouvrez EasyInventory, vous arrivez sur le tableau de bord. C'est le point d'entree recommande pour comprendre l'etat general avant de modifier quoi que ce soit.

La navigation principale se trouve sur le cote gauche:

- Tableau de bord: vue globale et indicateurs.
- Inventaire: liste des articles et recherche detaillee.
- Logs: journal complet des actions recentes.
- Documentation: aide integree dans l'application.
- Lieux: gestion des emplacements.
- Organisation: role courant, permissions et options de demonstration.

En haut de l'ecran, vous pouvez changer la langue, basculer le theme clair ou sombre, et creer un nouvel article.

## Tableau de bord

Le tableau de bord donne une vue rapide de l'activite et de la qualite de l'inventaire.

### Indicateurs principaux

Les cartes principales affichent:

- Articles: nombre total d'articles dans le perimetre selectionne.
- Sans photo principale: nombre d'articles qui doivent encore etre documentes visuellement.
- Lieux actifs: nombre de lieux disponibles pour l'exploitation.

Un nombre eleve dans "Sans photo principale" indique generalement qu'une campagne photo est necessaire. Ces articles sont plus difficiles a identifier rapidement par les equipes terrain.

### Filtrer par lieu

Le filtre de lieu permet de concentrer les indicateurs sur un site precis. Selectionnez un lieu pour verifier uniquement les articles de ce lieu. Selectionnez "Tous les lieux" pour revenir a la vue globale.

Ce filtre est utile avant une operation locale: controle de stock, preparation d'evenement, inventaire physique, retour de materiel ou verification d'un atelier.

### Graphique Statut

Le bloc Statut montre la repartition des articles par statut:

- Disponible
- Loue
- Reparation
- Vendu
- Perdu
- Doublon

Deux modes sont disponibles:

- Lines: une vue en barres horizontales pour comparer rapidement les volumes.
- Camembert: une vue circulaire pour comprendre la repartition globale.

Important: lorsqu'un statut vaut zero, il reste visible dans la liste mais sa barre est vide. Cela evite de croire qu'il existe un volume quand il n'y en a pas.

### Actions recentes

Le bloc Actions recentes affiche les dernieres actions importantes. Cliquez sur le titre du bloc ou sur "Voir tout" pour ouvrir la page Logs.

Utilisez cette zone pour verifier ce qui vient de changer: creation d'article, changement de statut, ajout de photo, modification de lieu ou modification de notes.

## Inventaire

La page Inventaire est la zone principale de travail. Elle permet de chercher, filtrer, consulter et modifier les articles.

### Comprendre une carte article

Chaque carte article affiche:

- la photo principale si elle existe;
- le tag de l'article;
- le nom de l'article;
- le statut;
- une note courte ou la categorie;
- le lieu;
- la derniere action connue.

Si l'article n'a pas de photo principale, la carte l'indique clairement. Cela permet de traiter facilement les articles incomplets.

### Rechercher un article

La recherche globale accepte plusieurs types d'informations:

- tag;
- nom;
- lieu;
- statut;
- categorie;
- notes;
- type d'action recente;
- role qui a realise une action.

Exemples de recherches utiles:

- Saisir `1001` pour retrouver un tag.
- Saisir `cafe` pour retrouver une machine a cafe.
- Saisir `Annecy` pour voir les articles d'un lieu.
- Saisir `reparation` pour retrouver les articles concernes.
- Saisir `manager` pour retrouver des actions associees a ce role.

### Filtrer l'inventaire

Les filtres permettent de reduire la liste:

- Lieux: affiche uniquement les articles d'un lieu.
- Statut: affiche uniquement les articles ayant un statut donne.
- Categorie: affiche uniquement une famille d'articles.

Les filtres peuvent etre combines. Par exemple, vous pouvez afficher uniquement les articles en reparation dans le lieu de Lyon.

### Trier les resultats

Le tri permet de modifier l'ordre d'affichage:

- Recents: affiche les articles modifies le plus recemment.
- Tag: classe par numero de tag.
- Nom: classe par nom d'article.
- Statut: regroupe par statut.
- Lieu: regroupe par emplacement.

Pour une recherche rapide sur le terrain, le tri par tag est souvent le plus direct. Pour un suivi manager, le tri par recence est souvent plus utile.

## Fiche article

Lorsque vous selectionnez une carte, la fiche detaillee de l'article s'ouvre.

### Informations modifiables

Selon votre role, vous pouvez modifier:

- Nom
- Tag
- Categorie
- Lieu
- Notes
- Statut

Chaque modification cree une trace dans l'historique de l'article.

### Bonnes pratiques pour les noms

Un bon nom doit etre court, clair et reconnaissable.

Exemples:

- `Machine a cafe mobile`
- `Table pliante XL`
- `Perceuse sans fil`
- `Lot rallonges electriques`

Evitez les noms trop vagues comme `materiel`, `objet`, `stock` ou `divers`. Ils rendent la recherche difficile.

### Bonnes pratiques pour les notes

Les notes doivent contenir les informations utiles pour l'exploitation:

- condition de l'article;
- accessoires manquants;
- prochaine action a faire;
- contexte de location;
- consignes de manipulation;
- commentaires terrain.

Exemples:

- `Kit complet, prevoir capsules.`
- `Batterie a remplacer.`
- `Louee pour evenement client.`
- `Controle effectue le mois dernier.`

## Statuts

Le statut indique l'etat operationnel de l'article.

### Disponible

L'article peut etre utilise, loue ou affecte. C'est le statut normal pour un article pret.

### Loue

L'article est actuellement sorti ou affecte a un client, un evenement ou une equipe.

Avant de remettre l'article en Disponible, verifiez qu'il est revenu physiquement et que son etat est correct.

### Reparation

L'article ne doit pas etre utilise tant qu'une intervention est necessaire.

Ajoutez une note claire pour expliquer le probleme: piece manquante, batterie defectueuse, controle necessaire, casse visible, nettoyage a faire.

### Vendu

L'article n'est plus disponible car il a ete vendu.

Ce statut permet de conserver une trace dans l'historique sans le traiter comme du stock disponible.

### Perdu

L'article est introuvable ou non restitue.

Utilisez ce statut lorsqu'une verification terrain n'a pas permis de retrouver l'article. Ajoutez une note avec le contexte connu.

### Doublon

L'article correspond a une fiche creee par erreur ou a un article deja represente ailleurs.

Avant de marquer un doublon, verifiez le tag, le nom, les photos et le lieu.

## Photos

Les photos sont essentielles pour identifier rapidement les articles.

### Photo principale

La photo principale est celle qui apparait sur la carte article. Elle doit montrer l'article de facon claire.

Une bonne photo principale:

- montre l'article entier;
- est nette;
- n'est pas trop sombre;
- ne contient pas trop d'objets parasites;
- permet de reconnaitre l'article sans lire le nom.

### Ajouter des photos

Dans la fiche article, utilisez le bouton d'ajout de photos. Vous pouvez ajouter plusieurs images si necessaire.

Ajoutez des photos supplementaires lorsque:

- l'article a plusieurs faces importantes;
- des accessoires doivent etre verifies;
- un defaut doit etre documente;
- le contenu d'un lot doit etre visible.

### Definir une photo principale

Dans la galerie, choisissez la photo la plus representative et definissez-la comme photo principale.

Si une carte indique "Sans photo principale", ouvrez la fiche article et ajoutez ou selectionnez une photo principale.

### Desactiver une photo

Desactivez une photo lorsqu'elle est floue, incorrecte, obsolete ou liee au mauvais article.

Une photo desactivee ne doit plus etre utilisee pour representer l'article.

## Logs et historique

La page Logs rassemble les actions recentes dans une vue unique.

Chaque ligne indique:

- l'action effectuee;
- l'article concerne;
- le lieu de l'article;
- le role acteur;
- la date et l'heure.

Cliquez sur une ligne pour revenir directement a l'article dans l'inventaire.

Utilisez les Logs pour:

- verifier les modifications recentes;
- comprendre pourquoi un article a change de statut;
- identifier les ajouts de photos;
- suivre les corrections faites par l'equipe;
- reconstituer une sequence d'actions.

## Lieux

Les lieux representent les emplacements de stockage ou d'exploitation: showroom, depot, atelier, zone de retour, agence, client, evenement.

### Creer un lieu

Depuis la page Lieux, renseignez le nom du lieu et des notes utiles.

Un bon lieu doit etre facile a comprendre pour toute l'equipe.

Exemples:

- `Annecy`
- `Geneve`
- `Lyon`
- `Atelier reparation`
- `Zone retours`
- `Showroom Paris`

### Desactiver un lieu

Desactivez un lieu lorsqu'il n'est plus utilise. Les donnees restent conservees pour l'historique, mais le lieu n'est plus considere comme actif.

Ne desactivez pas un lieu uniquement parce qu'il est temporairement vide. Gardez-le actif s'il peut encore recevoir des articles.

## Roles

Les roles definissent les actions autorisees.

### Owner

Role le plus complet. Il peut gerer l'ensemble de l'application et reinitialiser la demonstration.

### Admin

Role complet pour l'administration courante.

### Manager

Role adapte au pilotage operationnel. Il peut gerer les articles, les lieux, les photos et les statuts.

### Operator

Role terrain. Il peut intervenir sur les informations operationnelles comme les notes, les statuts et les photos, selon les droits configures.

## Routine conseillee

Pour garder l'inventaire propre, suivez cette routine:

1. Ouvrir le Tableau de bord.
2. Verifier le nombre d'articles sans photo principale.
3. Filtrer par lieu si vous travaillez sur un site precis.
4. Controler les statuts sensibles: Reparation, Perdu, Doublon.
5. Ouvrir l'Inventaire pour corriger les fiches incompletes.
6. Ajouter ou definir les photos principales manquantes.
7. Mettre a jour les notes lorsque le contexte terrain change.
8. Ouvrir les Logs pour verifier les actions recentes.

Cette routine peut etre faite en debut ou fin de journee, ou avant une operation importante.

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

## Bonnes pratiques

- Toujours ajouter une photo principale lorsqu'un article est cree.
- Utiliser des noms simples et coherents.
- Garder les notes factuelles et utiles.
- Mettre a jour le statut des qu'un article change d'etat.
- Utiliser le statut Reparation avant qu'un article defectueux soit reutilise.
- Utiliser le statut Perdu uniquement apres verification.
- Consulter les Logs apres une serie de modifications.
- Desactiver les lieux obsoletes plutot que les renommer pour un autre usage.

## Erreurs a eviter

- Creer plusieurs fiches pour le meme article.
- Laisser un article sans photo principale.
- Marquer un article Disponible alors qu'il est encore chez un client.
- Utiliser les notes pour des informations trop anciennes ou non verifiees.
- Desactiver une photo correcte par erreur.
- Renommer un lieu historique pour representer un nouveau lieu sans lien.

## Questions frequentes

### Je ne trouve pas un article

Essayez de chercher par tag, nom partiel, lieu, categorie ou statut. Si vous ne trouvez toujours rien, verifiez les Logs pour voir si l'article a ete renomme ou deplace.

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

## Support interne

Avant de demander de l'aide, notez:

- le tag de l'article;
- le nom de l'article;
- le lieu concerne;
- l'action que vous essayiez de faire;
- le message ou comportement observe;
- votre role actuel.

Ces informations permettent de comprendre plus vite le probleme et d'eviter les allers-retours.
