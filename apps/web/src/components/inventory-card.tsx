"use client";

import { Camera, Clock3, MapPin, Package, Tag } from "lucide-react";
import { getFrontPhoto, getLastAction } from "@/lib/inventory";
import { actionLabel, statusLabels, t } from "@/lib/i18n";
import type { InventoryState, Item, ItemStatus, Locale } from "@/lib/types";
import { HighlightText } from "./highlight-text";

function statusTone(status: ItemStatus) {
  return {
    AVAILABLE: "ok",
    RENTED: "info",
    REPAIR: "warn",
    SOLD: "dark",
    LOST: "danger",
    DUPLICATE: "muted",
  }[status];
}

export function InventoryCard({
  item,
  state,
  locale,
  selected,
  query,
  onSelect,
}: {
  item: Item;
  state: InventoryState;
  locale: Locale;
  selected: boolean;
  query: string;
  onSelect: () => void;
}) {
  const location = state.locations.find((entry) => entry.id === item.locationId);
  const photo = getFrontPhoto(state, item);
  const lastAction = getLastAction(state, item.id);

  return (
    <button className={`inventory-card ${selected ? "selected" : ""}`} onClick={onSelect} type="button">
      <div className="inventory-card-media">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={photo.originalName} />
        ) : (
          <div className="inventory-card-placeholder">
            <Camera size={34} />
            <span>Photo</span>
          </div>
        )}
        <span className="inventory-card-tag"><Tag size={14} /> #{item.tag}</span>
        {!photo && <span className="inventory-card-warning">{t(locale, "missingFront")}</span>}
      </div>

      <div className="inventory-card-body">
        <div className="inventory-card-title-row">
          <h3><HighlightText text={item.name} query={query} /></h3>
          <span className={`pill ${statusTone(item.status)}`}>{statusLabels[locale][item.status]}</span>
        </div>
        <p><HighlightText text={item.notes || item.category} query={query} /></p>
        <div className="inventory-card-meta">
          <span><MapPin size={14} /><HighlightText text={location?.name ?? "Unassigned"} query={query} /></span>
          <span><Package size={14} /><HighlightText text={item.category} query={query} /></span>
          <span><Clock3 size={14} />{actionLabel(locale, lastAction?.type)}</span>
        </div>
      </div>
    </button>
  );
}
