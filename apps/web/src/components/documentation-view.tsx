"use client";

import { BookOpen } from "lucide-react";

export function DocumentationView() {
  return (
    <section className="documentation-page">
      <div className="doc-hero panel">
        <p className="eyebrow"><BookOpen size={14} /> Documentation client</p>
        <h2>Comprendre et utiliser EasyInventory</h2>
        <p>
          Cette documentation presente les ecrans, les controles et les bonnes pratiques pour piloter un inventaire,
          suivre les changements et exploiter les donnees sans aide technique.
        </p>
      </div>

      <div className="doc-layout">
        <aside className="doc-index panel">
          <strong>Sommaire</strong>
          <a href="#dashboard">Tableau de bord</a>
          <a href="#inventory">Inventaire</a>
          <a href="#photos">Photos</a>
          <a href="#logs">Logs</a>
          <a href="#locations">Lieux</a>
          <a href="#roles">Roles</a>
          <a href="#daily">Routine</a>
        </aside>

        <div className="doc-content">
          <article id="dashboard" className="panel doc-section">
            <span>01</span>
            <h3>Tableau de bord</h3>
            <p>
              Le tableau de bord donne une lecture immediate de l'activite: nombre total d'articles, articles sans photo
              principale, lieux actifs et repartition par statut. Le filtre de lieu permet d'isoler un site precis sans
              modifier les donnees.
            </p>
            <ul>
              <li>Le graphique Statut dispose d'un mode Lines et d'un mode Camembert.</li>
              <li>Une valeur a zero est affichee comme une barre vide et reste lisible dans la legende.</li>
              <li>Le bloc Actions recentes ouvre une page de logs complete.</li>
            </ul>
          </article>

          <article id="inventory" className="panel doc-section">
            <span>02</span>
            <h3>Inventaire</h3>
            <p>
              L'inventaire regroupe les articles sous forme de cartes. Chaque carte affiche le tag, le nom, le statut,
              le lieu, la categorie et la derniere action connue. La recherche globale accepte les tags, noms, lieux,
              statuts, categories et notes.
            </p>
            <ul>
              <li>Les filtres reduisent la liste par lieu, statut et categorie.</li>
              <li>Le tri permet de classer par recence, tag, nom, statut ou lieu.</li>
              <li>Selectionner une carte ouvre le panneau detail de l'article.</li>
            </ul>
          </article>

          <article id="photos" className="panel doc-section">
            <span>03</span>
            <h3>Photos et fiche article</h3>
            <p>
              La fiche article centralise la photo principale, la galerie, les champs editables, les statuts et
              l'historique de l'objet. Les photos peuvent etre ajoutees, definies comme principales ou desactivees selon
              les droits du role connecte.
            </p>
            <ul>
              <li>Une photo principale manquante est signalee sur la carte et dans les indicateurs.</li>
              <li>Les changements de nom, tag, categorie, lieu, notes et statut creent une entree d'historique.</li>
              <li>Les images sont integrees avec un fondu afin de conserver une lecture visuelle douce.</li>
            </ul>
          </article>

          <article id="logs" className="panel doc-section">
            <span>04</span>
            <h3>Logs et actions recentes</h3>
            <p>
              La page Logs liste les actions dans l'ordre chronologique inverse. Chaque ligne indique l'action, l'article
              concerne, le lieu, le role acteur et la date exacte. Cliquer sur une ligne ramene directement vers l'article.
            </p>
          </article>

          <article id="locations" className="panel doc-section">
            <span>05</span>
            <h3>Lieux</h3>
            <p>
              La page Lieux permet de maintenir les espaces de stockage, showrooms, ateliers ou zones de retour. Un lieu
              inactif reste conserve pour l'historique mais n'est plus propose comme emplacement courant.
            </p>
          </article>

          <article id="roles" className="panel doc-section">
            <span>06</span>
            <h3>Roles et permissions</h3>
            <p>
              Les roles structurent les responsabilites: owner et admin ont les droits complets, manager gere les
              operations courantes, operator intervient sur les notes, statuts et photos. Les boutons non autorises sont
              desactives pour rendre les limites explicites.
            </p>
          </article>

          <article id="daily" className="panel doc-section">
            <span>07</span>
            <h3>Routine conseillee</h3>
            <p>
              Commencer par le tableau de bord, traiter les articles sans photo principale, controler les statuts
              sensibles, puis ouvrir les logs pour verifier les changements recents. Cette routine garde l'inventaire
              fiable et lisible pour les equipes terrain comme pour la direction.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
