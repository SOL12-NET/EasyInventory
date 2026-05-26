"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { categories, getFrontPhoto } from "@/lib/inventory";
import { statusLabels, t } from "@/lib/i18n";
import { statuses, type InventoryState, type Item, type Locale } from "@/lib/types";

export function InventoryDetailPanel({
  locale,
  state,
  selectedItem,
  mobileOpen,
  closeMobile,
  setItemPatch,
  handlePhoto,
}: {
  locale: Locale;
  state: InventoryState;
  selectedItem: Item | null;
  mobileOpen: boolean;
  closeMobile: () => void;
  setItemPatch: (patch: Partial<Item>, action?: string) => void;
  handlePhoto: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const selectedPhoto = getFrontPhoto(state, selectedItem);

  return (
    <aside className={`detail-drawer panel ${mobileOpen ? "open" : ""}`}>
      {selectedItem ? (
        <>
          <div className="detail-drawer-header">
            <div>
              <span>#{selectedItem.tag}</span>
              <h3>{selectedItem.name}</h3>
            </div>
            <button className="icon-button drawer-close" onClick={closeMobile} type="button" aria-label="Close detail">
              <X size={18} />
            </button>
          </div>

          <div className="photo-hero">
            {selectedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPhoto.url} alt={selectedPhoto.originalName} />
            ) : (
              <div className="photo-empty"><Camera size={42} /><span>{t(locale, "missingFront")}</span></div>
            )}
            <label className="upload-button">
              <ImagePlus size={18} />
              {t(locale, "addPhoto")}
              <input type="file" accept="image/*" onChange={handlePhoto} />
            </label>
          </div>

          <div className="detail-form">
            <label>
              Nom
              <input value={selectedItem.name} onChange={(event) => setItemPatch({ name: event.target.value }, "EDIT_NAME")} />
            </label>
            <label>
              Tag
              <input value={selectedItem.tag} onChange={(event) => setItemPatch({ tag: event.target.value }, "EDIT_TAG")} />
            </label>
            <label>
              {t(locale, "category")}
              <select value={selectedItem.category} onChange={(event) => setItemPatch({ category: event.target.value }, "EDIT_CATEGORY")}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              {t(locale, "locations")}
              <select value={selectedItem.locationId} onChange={(event) => setItemPatch({ locationId: event.target.value }, "EDIT_LOCATION")}>
                {state.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
            <label className="wide-field">
              {t(locale, "notes")}
              <textarea value={selectedItem.notes} onChange={(event) => setItemPatch({ notes: event.target.value }, "EDIT_NOTES")} />
            </label>
          </div>

          <div className="status-actions">
            {statuses.map((status) => (
              <button
                className={`status-button ${selectedItem.status === status ? "active" : ""}`}
                key={status}
                onClick={() => setItemPatch({ status }, `SET_${status}`)}
                type="button"
              >
                {statusLabels[locale][status]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">{t(locale, "empty")}</div>
      )}
    </aside>
  );
}
