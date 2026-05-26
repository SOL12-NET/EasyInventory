"use client";

import { Camera, Check, History, ImagePlus, ShieldAlert, Star, Trash2, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { categories, getItemActions, getItemPhotos } from "@/lib/inventory";
import { actionLabel, statusLabels, t } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { statuses, type InventoryState, type Item, type Locale, type Role } from "@/lib/types";

export function InventoryDetailPanel({
  locale,
  state,
  role,
  selectedItem,
  mobileOpen,
  closeMobile,
  setItemPatch,
  handlePhoto,
  setFrontPhoto,
  deactivatePhoto,
}: {
  locale: Locale;
  state: InventoryState;
  role: Role;
  selectedItem: Item | null;
  mobileOpen: boolean;
  closeMobile: () => void;
  setItemPatch: (patch: Partial<Item>, action?: string) => void;
  handlePhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  setFrontPhoto: (itemId: string, photoId: string) => void;
  deactivatePhoto: (itemId: string, photoId: string) => void;
}) {
  const photos = getItemPhotos(state, selectedItem);
  const selectedPhoto = photos[0] ?? null;
  const actions = selectedItem ? getItemActions(state, selectedItem.id) : [];
  const canEditCore = can(role, "edit:item-core");
  const canEditLocation = can(role, "edit:item-location");
  const canEditNotes = can(role, "edit:item-notes");
  const canEditStatus = can(role, "edit:item-status");
  const canAddPhotos = can(role, "add:photos");
  const canManagePhotos = can(role, "manage:photos");

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
            <label className={`upload-button ${!canAddPhotos ? "disabled" : ""}`}>
              <ImagePlus size={18} />
              {t(locale, "addPhoto")}
              <input disabled={!canAddPhotos} multiple type="file" accept="image/*" onChange={handlePhoto} />
            </label>
          </div>

          {!canAddPhotos && <p className="permission-note"><ShieldAlert size={14} /> {t(locale, "disabledByRole")}</p>}

          <section className="photo-gallery">
            <div className="section-title">
              <span>{t(locale, "gallery")}</span>
              <strong>{photos.length}</strong>
            </div>
            {photos.length === 0 && <div className="empty-state small">{t(locale, "noPhoto")}</div>}
            <div className="photo-strip">
              {photos.map((photo) => (
                <article className={`photo-thumb ${photo.id === selectedItem.frontPhotoId ? "front" : ""}`} key={photo.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.originalName} />
                  <div>
                    <span>{photo.originalName}</span>
                    {photo.id === selectedItem.frontPhotoId && <strong><Star size={13} /> {t(locale, "frontPhoto")}</strong>}
                  </div>
                  <div className="photo-actions">
                    <button disabled={!canManagePhotos || photo.id === selectedItem.frontPhotoId} onClick={() => setFrontPhoto(selectedItem.id, photo.id)} type="button">
                      <Check size={14} />
                      {t(locale, "setFrontPhoto")}
                    </button>
                    <button disabled={!canManagePhotos} onClick={() => deactivatePhoto(selectedItem.id, photo.id)} type="button">
                      <Trash2 size={14} />
                      {t(locale, "deactivatePhoto")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="detail-form">
            <label>
              Nom
              <input disabled={!canEditCore} value={selectedItem.name} onChange={(event) => setItemPatch({ name: event.target.value }, "EDIT_NAME")} />
            </label>
            <label>
              Tag
              <input disabled={!canEditCore} value={selectedItem.tag} onChange={(event) => setItemPatch({ tag: event.target.value }, "EDIT_TAG")} />
            </label>
            <label>
              {t(locale, "category")}
              <select disabled={!canEditCore} value={selectedItem.category} onChange={(event) => setItemPatch({ category: event.target.value }, "EDIT_CATEGORY")}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              {t(locale, "locations")}
              <select disabled={!canEditLocation} value={selectedItem.locationId} onChange={(event) => setItemPatch({ locationId: event.target.value }, "EDIT_LOCATION")}>
                {state.locations.filter((location) => location.active || location.id === selectedItem.locationId).map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>
            <label className="wide-field">
              {t(locale, "notes")}
              <textarea disabled={!canEditNotes} value={selectedItem.notes} onChange={(event) => setItemPatch({ notes: event.target.value }, "EDIT_NOTES")} />
            </label>
          </div>

          <div className="status-actions">
            {statuses.map((status) => (
              <button
                className={`status-button ${selectedItem.status === status ? "active" : ""}`}
                disabled={!canEditStatus}
                key={status}
                onClick={() => setItemPatch({ status }, `SET_${status}`)}
                type="button"
              >
                {statusLabels[locale][status]}
              </button>
            ))}
          </div>

          <section className="history-panel">
            <div className="section-title">
              <span><History size={16} /> {t(locale, "history")}</span>
              <strong>{actions.length}</strong>
            </div>
            {actions.length === 0 && <div className="empty-state small">{t(locale, "noHistory")}</div>}
            <div className="history-list">
              {actions.map((action) => (
                <article key={action.id}>
                  <div><ActivityDot /><strong>{actionLabel(locale, action.type)}</strong></div>
                  <span>{action.actor} - {new Date(action.at).toLocaleString()}</span>
                  <code>{action.type}</code>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">{t(locale, "empty")}</div>
      )}
    </aside>
  );
}

function ActivityDot() {
  return <span className="activity-dot" aria-hidden="true" />;
}
