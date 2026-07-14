"use client";

import { Activity, LineChart } from "lucide-react";
import { actionLabel, t } from "@/lib/i18n";
import { type InventoryAction, type InventoryState, type Locale } from "@/lib/types";
import { ActionActivityChart, type View } from "./dashboard-view";

export function LogsView({
  locale,
  state,
  setSelectedId,
  setView,
}: {
  locale: Locale;
  state: InventoryState;
  setSelectedId: (id: string) => void;
  setView: (view: View) => void;
}) {
  const actions = [...state.actions].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  function actionContext(action: InventoryAction) {
    const item = state.items.find((entry) => entry.id === action.itemId);
    const location = state.locations.find((entry) => entry.id === item?.locationId);
    return { item, location };
  }

  return (
    <section className="logs-page">


      <div className="panel">
        <div className="panel-title"><LineChart size={18} /><h3>{t(locale, "actionActivity")}</h3></div>
        <ActionActivityChart actions={actions} locale={locale} advanced />
      </div>

      <div className="panel logs-list">
        <div className="panel-title"><Activity size={18} /><h3>{t(locale, "recentActions")}</h3></div>
        {actions.length === 0 && <div className="empty-state">{t(locale, "noHistory")}</div>}
        {actions.map((action) => {
          const { item, location } = actionContext(action);
          return (
            <button
              className="log-row"
              key={action.id}
              onClick={() => {
                if (item) setSelectedId(item.id);
                setView("inventory");
              }}
              type="button"
            >
              <span className="activity-dot" aria-hidden="true" />
              <div>
                <strong>{actionLabel(locale, action.type)}</strong>
                <span>{item ? `#${item.tag} - ${item.name}` : action.itemId}</span>
              </div>
              <div>
                <span>{location?.name ?? t(locale, "locations")}</span>
                <code>{action.actor}</code>
              </div>
              <time dateTime={action.at}>{new Date(action.at).toLocaleString()}</time>
            </button>
          );
        })}
      </div>
    </section>
  );
}
