"use client";

import {
  Plus,
  Search,
  Tag,
  LogOut,
  RotateCcw,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Camera,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  KeyRound,
  X
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { t, actionLabel, statusLabels } from "@/lib/i18n";
import { statuses, type InventoryState, type Item, type Locale, type Role, type ItemStatus } from "@/lib/types";
import { searchItems, getItemPhotos, getLastAction, summarizeInventory, normalizeSearchText } from "@/lib/inventory";
import { statusColors } from "./dashboard-view";

export function OperatorView({
  locale,
  state,
  activeAccount,
  activeLocationId,
  setActiveLocationId,
  onSwitchUser,
  onResetDemo,
  onUpdateItem,
  onCreateItem,
  onUploadPhotos,
  onChangePassword,
}: {
  locale: Locale;
  state: InventoryState;
  activeAccount: { id: string; name: string; locationIds: string[] };
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
  onSwitchUser: () => void;
  onResetDemo: () => void;
  onUpdateItem: (id: string, patch: Partial<Item>, action?: string) => void;
  onCreateItem: (locationId: string) => Promise<string | undefined>;
  onUploadPhotos: (itemId: string, files: FileList) => void;
  onChangePassword: (newPassword: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"name" | "tag">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [operatorViewMode, setOperatorViewMode] = useState<"inventory" | "dashboard">("inventory");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [lastUsedLocationId, setLastUsedLocationId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("easyinventory.saas.last-used-create-location") || activeLocationId;
    }
    return activeLocationId;
  });

  const [localName, setLocalName] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [actionsLimit, setActionsLimit] = useState(10);

  // Infinite scroll state for list display
  const [visibleItemsCount, setVisibleItemsCount] = useState(30);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Locations allowed for this operator
  const allowedLocations = useMemo(() => {
    if (!activeAccount.locationIds || activeAccount.locationIds.length === 0) {
      return state.locations.filter((loc) => loc.active);
    }
    return state.locations.filter((loc) => loc.active && activeAccount.locationIds.includes(loc.id));
  }, [state.locations, activeAccount.locationIds]);

  // Current active location object
  const activeLocation = useMemo(() => {
    return state.locations.find((l) => l.id === activeLocationId) ?? allowedLocations[0] ?? null;
  }, [state.locations, activeLocationId, allowedLocations]);

  // Filtered items based on active location and search query
  const filteredItems = useMemo(() => {
    if (!activeLocation) return [];
    const needle = normalizeSearchText(searchQuery);
    const itemsInLocation = state.items.filter((item) => item.locationId === activeLocation.id);
    if (!needle) {
      return [...itemsInLocation].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    if (searchMode === "tag") {
      return itemsInLocation.filter((item) => normalizeSearchText(item.tag).includes(needle));
    } else {
      return itemsInLocation.filter((item) => normalizeSearchText(item.name).includes(needle));
    }
  }, [state.items, searchQuery, searchMode, activeLocation]);

  // Paginated items (infinite scroll slice)
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(0, visibleItemsCount);
  }, [filteredItems, visibleItemsCount]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleItemsCount(30);
  }, [searchQuery, activeLocationId, searchMode]);

  // Ref callback to initialize IntersectionObserver on the sentinel node
  const sentinelRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setVisibleItemsCount((prev) => prev + 20);
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(node);
      observerRef.current = obs;
    }
  };

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return state.items.find((item) => item.id === selectedItemId) ?? null;
  }, [state.items, selectedItemId]);

  // Sync local input values with selected item changes
  useEffect(() => {
    if (selectedItem) {
      setLocalName(selectedItem.name);
      setLocalNotes(selectedItem.notes);
    } else {
      setLocalName("");
      setLocalNotes("");
    }
  }, [selectedItem?.id]);

  // Debounce and auto-save name changes
  useEffect(() => {
    if (!selectedItem || localName === selectedItem.name) return;
    const t = setTimeout(() => {
      onUpdateItem(selectedItem.id, { name: localName }, "EDIT_NAME");
    }, 300);
    return () => clearTimeout(t);
  }, [localName, selectedItem?.id]);

  // Debounce and auto-save notes changes
  useEffect(() => {
    if (!selectedItem || localNotes === selectedItem.notes) return;
    const t = setTimeout(() => {
      onUpdateItem(selectedItem.id, { notes: localNotes }, "EDIT_NOTES");
    }, 300);
    return () => clearTimeout(t);
  }, [localNotes, selectedItem?.id]);

  // Simplified status list (omitting DUPLICATE from operator view)
  const operatorStatuses: ItemStatus[] = ["AVAILABLE", "RENTED", "REPAIR", "SOLD", "LOST"];

  // Location statistics for active location dashboard
  const localSummary = useMemo(() => {
    return summarizeInventory(state, activeLocationId);
  }, [state, activeLocationId]);

  // Active location actions for active location dashboard
  const localActions = useMemo(() => {
    const activeLocItemIds = new Set(
      state.items.filter((item) => item.locationId === activeLocationId).map((item) => item.id)
    );
    return state.actions
      .filter((action) => activeLocItemIds.has(action.itemId))
      .slice(0, 50);
  }, [state.actions, state.items, activeLocationId]);

  const activePhoto = useMemo(() => {
    if (!selectedItem) return null;
    const photos = getItemPhotos(state, selectedItem);
    return photos[0] ?? null;
  }, [state, selectedItem]);

  const lastAction = useMemo(() => {
    if (!selectedItem) return null;
    return getLastAction(state, selectedItem.id);
  }, [state, selectedItem]);

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0 && selectedItem) {
      onUploadPhotos(selectedItem.id, files);
    }
  }

  async function handleCreateItemAtLocation(locId: string) {
    const newId = await onCreateItem(locId);
    setLastUsedLocationId(locId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("easyinventory.saas.last-used-create-location", locId);
    }
    setCreateDropdownOpen(false);
    if (newId) {
      setSelectedItemId(newId);
      setOperatorViewMode("inventory");
    }
  }



  return (
    <div className="operator-layout-wrapper">
      {/* Header Profile Pill */}
      <header className="operator-header">
        <div className="operator-profile-pill-container">
          <button
            className="operator-profile-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            type="button"
          >
            <span className="operator-pill-role">operator</span>
            <span className="operator-pill-at">@</span>
            <span className="operator-pill-location">{activeLocation?.name ?? "..."}</span>
          </button>

          {dropdownOpen && (
            <div className="operator-dropdown-menu">
              <button
                className="operator-dropdown-item"
                onClick={() => {
                  setOperatorViewMode(operatorViewMode === "dashboard" ? "inventory" : "dashboard");
                  setDropdownOpen(false);
                }}
                type="button"
              >
                <LayoutDashboard size={16} />
                <span>{operatorViewMode === "dashboard" ? t(locale, "inventory") : t(locale, "dashboard")}</span>
              </button>

              {allowedLocations.length > 1 && (
                <button
                  className="operator-dropdown-item"
                  onClick={() => {
                    setLocationModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  type="button"
                >
                  <MapPin size={16} />
                  <span>{t(locale, "selectActiveLocation")}</span>
                </button>
              )}

              <button
                className="operator-dropdown-item"
                onClick={() => {
                  onSwitchUser();
                  setDropdownOpen(false);
                }}
                type="button"
              >
                <LogOut size={16} />
                <span>{t(locale, "changeUser")}</span>
              </button>

              <button
                className="operator-dropdown-item"
                onClick={() => {
                  setPasswordModalOpen(true);
                  setDropdownOpen(false);
                }}
                type="button"
              >
                <KeyRound size={16} />
                <span>{t(locale, "changePassword")}</span>
              </button>

              <button
                className="operator-dropdown-item"
                onClick={() => {
                  if (confirm(t(locale, "resetDemo"))) {
                    onResetDemo();
                  }
                  setDropdownOpen(false);
                }}
                type="button"
              >
                <RotateCcw size={16} />
                <span>{t(locale, "resetDemo")}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {operatorViewMode === "dashboard" ? (
        /* Operator Dashboard View */
        <main className="operator-dashboard-container">
          <div className="operator-card dashboard-hero" style={{ padding: "12px 16px" }}>
            <h2 style={{ fontSize: "1.2rem", margin: "0" }}>{activeLocation?.name}</h2>
          </div>

          <button
            className="primary-button wide"
            onClick={() => setOperatorViewMode("inventory")}
            type="button"
            style={{ height: "48px", marginBottom: "4px" }}
          >
            <Layers size={18} />
            {t(locale, "inventory")}
          </button>

          <div className="operator-stats-grid">
            <div className="operator-stat-card">
              <h3>{t(locale, "totalItems")}</h3>
              <strong>{localSummary.total}</strong>
            </div>
            <div className="operator-stat-card">
              <h3>{t(locale, "missingFront")}</h3>
              <strong className={localSummary.missingFront > 0 ? "warning-accent" : ""}>
                {localSummary.missingFront}
              </strong>
            </div>
          </div>

          <div className="operator-card">
            <h3>{t(locale, "status")}</h3>
            <div className="operator-status-summary-list">
              {operatorStatuses.map((status) => {
                const count = localSummary.byStatus[status] ?? 0;
                return (
                  <div key={status} className="operator-status-summary-row">
                    <span className="status-indicator-dot" style={{ backgroundColor: statusColors[status] }} />
                    <span className="status-label">{statusLabels[locale][status]}</span>
                    <strong className="status-count">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {localActions.length > 0 && (
            <div className="operator-card">
              <h3>{t(locale, "recentActions")}</h3>
              <div className="operator-recent-actions-list">
                {localActions.slice(0, actionsLimit).map((action) => {
                  const item = state.items.find((i) => i.id === action.itemId);
                  return (
                    <div key={action.id} className="operator-recent-action-row">
                      <div className="action-row-header">
                        <strong>{item?.name ?? `#${action.itemId.slice(0,4)}`}</strong>
                        <span>{new Date(action.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="action-row-footer">
                        <span>{actionLabel(locale, action.type)}</span>
                        <code>{action.actor}</code>
                      </div>
                    </div>
                  );
                })}
              </div>
              {localActions.length > actionsLimit && actionsLimit < 50 && (
                <button
                  type="button"
                  onClick={() => setActionsLimit(50)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px dashed var(--line)",
                    borderRadius: "6px",
                    color: "var(--primary)",
                    padding: "10px",
                    marginTop: "12px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  {locale === "fr" ? "Voir plus" : locale === "es" ? "Ver más" : "See more"}
                </button>
              )}
            </div>
          )}
        </main>
      ) : (
        /* Operator Inventory & Edit View */
        <main className="operator-main-content">
          {/* Search & Actions Bar */}
          <div className="operator-search-bar">
              <button
                className="operator-add-btn"
                onClick={() => {
                  handleCreateItemAtLocation(activeLocationId);
                }}
                type="button"
                aria-label={t(locale, "newItem")}
              >
                <Plus size={20} />
              </button>

            <div className="operator-input-wrapper">
              <input
                type="text"
                pattern={searchMode === "tag" ? "[0-9]*" : undefined}
                inputMode={searchMode === "tag" ? "numeric" : "text"}
                placeholder={searchMode === "tag" ? t(locale, "enterTagDigits") : t(locale, "searchByName")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleItemsCount(30);
                  setSelectedItemId(null);
                }}
              />
            </div>

            <button
              className={`operator-search-mode-toggle ${searchMode === "tag" ? "active" : ""}`}
              onClick={() => {
                setSearchMode(searchMode === "tag" ? "name" : "tag");
                setSearchQuery("");
                setVisibleItemsCount(30);
                setSelectedItemId(null);
              }}
              type="button"
              title={t(locale, "switchSearchMode")}
            >
              {searchMode === "tag" ? <Tag size={18} /> : <Search size={18} />}
            </button>
          </div>

          {/* Results Area */}
          {!selectedItem && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px", width: "100%" }}>
              {filteredItems.length === 0 ? (
                <div className="operator-card" style={{ padding: "16px", textAlign: "center", color: "var(--muted)" }}>
                  {t(locale, "empty")}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    {paginatedItems.map((item) => (
                      <button
                        key={item.id}
                        className={`operator-result-row ${selectedItemId === item.id ? "active" : ""}`}
                        onClick={() => setSelectedItemId(item.id)}
                        type="button"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          padding: "14px 16px",
                          background: selectedItemId === item.id ? "var(--field)" : "var(--panel)",
                          border: `1px solid ${selectedItemId === item.id ? "var(--primary)" : "var(--panel-border)"}`,
                          borderRadius: "12px",
                          boxShadow: "var(--shadow)",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "var(--ink)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--primary)" }}>#{item.tag}</span>
                            <span style={{ fontSize: "1rem", fontWeight: "600" }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={12} />
                            {state.locations.find((l) => l.id === item.locationId)?.name ?? item.locationId}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: `${statusColors[item.status]}18`,
                          color: statusColors[item.status],
                          textTransform: "uppercase"
                        }}>
                          {statusLabels[locale][item.status]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Sentinel for infinite scroll */}
                  {filteredItems.length > visibleItemsCount && (
                    <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", padding: "16px 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                      {locale === "fr" ? "Chargement de la suite..." : locale === "es" ? "Cargando más..." : "Loading more..."}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Selected Item Editor Card */}
          {selectedItem && (
            <article className="operator-card operator-editor-card" style={{ marginTop: "20px" }}>
              <div className="editor-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="editor-card-tag">#{selectedItem.tag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedItemId(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title={t(locale, "cancel")}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Grid */}
              <div className="editor-card-form-grid">
                <div className="form-grid-left">
                  <label>
                    nom
                    <input
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                    />
                  </label>

                  {allowedLocations.length > 1 && (
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "10px" }}>
                      <span>{t(locale, "activeLocation")}</span>
                      <select
                        value={selectedItem.locationId}
                        onChange={(e) => onUpdateItem(selectedItem.id, { locationId: e.target.value }, "MOVE_ITEM")}
                        style={{
                          height: "44px",
                          padding: "0 12px",
                          border: "1px solid var(--line)",
                          borderRadius: "6px",
                          background: "var(--field)",
                          color: "var(--ink)",
                          fontSize: "0.95rem"
                        }}
                      >
                        {allowedLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <div className="form-grid-right">
                  <label className="operator-image-uploader-label">
                    {activePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activePhoto.url} alt={activePhoto.originalName} className="operator-card-thumbnail" />
                    ) : (
                      <div className="operator-card-thumbnail placeholder">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/inventory-placeholder.png" alt="" />
                      </div>
                    )}
                    <div className="image-uploader-overlay">
                      <Camera size={18} />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              {/* Status Selector Grid */}
              <div className="operator-status-grid-selector">
                {operatorStatuses.map((status) => {
                  const isActive = selectedItem.status === status;
                  return (
                    <button
                      key={status}
                      className={`operator-status-btn ${isActive ? "active" : ""}`}
                      style={{
                        borderColor: isActive ? statusColors[status] : undefined,
                        backgroundColor: isActive ? `${statusColors[status]}15` : undefined,
                        color: isActive ? statusColors[status] : undefined,
                      }}
                      onClick={() => onUpdateItem(selectedItem.id, { status }, `SET_${status}`)}
                      type="button"
                    >
                      {statusLabels[locale][status]}
                    </button>
                  );
                })}
              </div>

              {/* Notes Area */}
              <label className="operator-notes-field">
                notes
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                />
              </label>

              {/* Pied de Carte - Dernier Historique */}
              {lastAction && (
                <footer className="operator-card-footer-history">
                  <Clock size={12} />
                  <span>
                    {actionLabel(locale, lastAction.type).toLowerCase()} ({lastAction.actor}){" "}
                    {new Date(lastAction.at).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </footer>
              )}
            </article>
          )}
        </main>
      )}

      {/* Active Location Switcher Modal */}
      {locationModalOpen && (
        <div className="operator-modal-backdrop" onClick={() => setLocationModalOpen(false)}>
          <div className="operator-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t(locale, "selectActiveLocation")}</h3>
            <div className="operator-modal-locations-list">
              {allowedLocations.map((loc) => (
                <button
                  key={loc.id}
                  className={`operator-modal-location-btn ${activeLocationId === loc.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveLocationId(loc.id);
                    setSelectedItemId(null);
                    setSearchQuery("");
                    setLocationModalOpen(false);
                  }}
                  type="button"
                >
                  <MapPin size={16} />
                  <span>{loc.name}</span>
                </button>
              ))}
            </div>
            <button
              className="primary-button wide"
              onClick={() => setLocationModalOpen(false)}
              type="button"
              style={{ marginTop: "16px" }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordModalOpen && (
        <div className="operator-modal-backdrop" onClick={() => setPasswordModalOpen(false)}>
          <form
            className="operator-modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (newPasswordInput.trim().length < 6) return;
              onChangePassword(newPasswordInput.trim());
              setNewPasswordInput("");
              setPasswordModalOpen(false);
              alert(t(locale, "saveSuccess"));
            }}
          >
            <h3>{t(locale, "changePassword")}</h3>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span>{t(locale, "newPassword")} (min. 6 caract.)</span>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  height: "44px",
                  padding: "0 12px",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  background: "var(--field)",
                  color: "var(--ink)",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPasswordModalOpen(false)}
                style={{ flex: 1, padding: "10px 0" }}
              >
                {t(locale, "cancel")}
              </button>
              <button
                type="submit"
                className="primary-button"
                style={{ flex: 1, padding: "10px 0" }}
                disabled={newPasswordInput.trim().length < 6}
              >
                {t(locale, "save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
