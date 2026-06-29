"use client";

import { ShieldCheck, CheckCircle2, Activity, Edit3 } from "lucide-react";
import { t } from "@/lib/i18n";
import { can, roleLabel } from "@/lib/permissions";
import { type Role, type Locale } from "@/lib/types";

export function SettingsView({
  locale,
  role,
  setRole,
  resetDemo,
}: {
  locale: Locale;
  role: Role;
  setRole: (role: Role) => void;
  resetDemo: () => void;
}) {
  return (
    <section className="settings-grid">
      <article className="panel">
        <div className="panel-title"><ShieldCheck size={18} /><h3>Controle SaaS</h3></div>
        <label>
          {t(locale, "role")}
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            {(["owner", "admin", "manager", "operator"] as Role[]).map((entry) => (
              <option key={entry} value={entry}>{roleLabel(entry)}</option>
            ))}
          </select>
        </label>
        <ul className="check-list">
          <li><CheckCircle2 size={17} /> Controle des roles pour proteger les actions sensibles</li>
          <li><CheckCircle2 size={17} /> Donnees organisees par organisation, lieux, articles et photos</li>
          <li><CheckCircle2 size={17} /> Docker Compose avec services locaux pour les validations</li>
          <li><CheckCircle2 size={17} /> Mode demo local utilisable sans secrets</li>
          <li><CheckCircle2 size={17} /> Galerie, historique et permissions prets pour API future</li>
        </ul>
        <button className="primary-button wide" disabled={!can(role, "reset:demo")} onClick={resetDemo} type="button">
          <Edit3 size={17} />
          {t(locale, "resetDemo")}
        </button>
      </article>
      <article className="panel dark-panel">
        <Activity size={24} />
        <h3>Score operationnel</h3>
        <strong>98%</strong>
        <span>Inventaire pret pour validation metier V1</span>
      </article>
    </section>
  );
}
