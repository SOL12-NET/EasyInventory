"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  CircleOff,
  DatabaseZap,
  Edit3,
  Filter,
  Gauge,
  Globe2,
  Layers3,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  PackagePlus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { InventoryCardsView } from "@/components/inventory-cards-view";
import {
  addLocation,
  addPhotosToItem,
  cloneDemoState,
  createItem,
  deactivatePhoto,
  setFrontPhoto,
  summarizeInventory,
  updateItem,
  updateLocation,
} from "@/lib/inventory";
import { statusLabels, t } from "@/lib/i18n";
import { can, roleLabel } from "@/lib/permissions";
import { statuses, type InventoryState, type Item, type Locale, type Role } from "@/lib/types";

type View = "dashboard" | "inventory" | "locations" | "settings";
type Theme = "light" | "dark";

const storageKey = "easyinventory.saas.demo-state";
const themeStorageKey = "easyinventory.saas.theme";
const roleStorageKey = "easyinventory.saas.demo-role";

function loadState() {
  if (typeof window === "undefined") return cloneDemoState();
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as InventoryState) : cloneDemoState();
  } catch {
    return cloneDemoState();
  }
}

export function EasyInventoryApp({ initialView = "dashboard" }: { initialView?: string }) {
  const [state, setState] = useState<InventoryState>(() => cloneDemoState());
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [theme, setTheme] = useState<Theme>("light");
  const [role, setRole] = useState<Role>("manager");
  const [view, setView] = useState<View>(isView(initialView) ? initialView : "dashboard");
  const [dashboardLocationFilter, setDashboardLocationFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("item-1001");
  const [inventoryResetSignal, setInventoryResetSignal] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationNotes, setNewLocationNotes] = useState("");
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      setState(loadState());
      const savedTheme = window.localStorage.getItem(themeStorageKey);
      const savedRole = window.localStorage.getItem(roleStorageKey);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light");
      if (isRole(savedRole)) setRole(savedRole);
    } catch {
      setStorageError(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      setStorageError(true);
    }
  }, [ready, state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (!ready) return;
    try {
      window.localStorage.setItem(themeStorageKey, theme);
      window.localStorage.setItem(roleStorageKey, role);
    } catch {
      setStorageError(true);
    }
  }, [ready, role, theme]);

  const selectedItem = state.items.find((item) => item.id === selectedId) ?? state.items[0] ?? null;
  const summary = useMemo(() => summarizeInventory(state, dashboardLocationFilter), [state, dashboardLocationFilter]);

  function setItemPatch(patch: Partial<Item>, action = "EDIT_ITEM") {
    if (!selectedItem) return;
    setState((current) => updateItem(current, selectedItem.id, patch, action, role));
  }

  function handleNewItem() {
    const locationId = state.locations.find((location) => location.active)?.id;
    if (!locationId) return;
    setState((current) => {
      const next = createItem(current, locationId, role);
      setSelectedId(next.items[0]?.id ?? selectedId);
      return next;
    });
    setInventoryResetSignal((value) => value + 1);
    setView("inventory");
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !selectedItem || !can(role, "add:photos")) return;
    Promise.all(
      files.map((file) =>
        new Promise<{ url: string; originalName: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: String(reader.result), originalName: file.name });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
      ),
    )
      .then((photos) => setState((current) => addPhotosToItem(current, selectedItem.id, photos, role)))
      .catch(() => setStorageError(true));
    event.target.value = "";
  }

  function resetDemo() {
    const next = cloneDemoState();
    setState(next);
    setSelectedId(next.items[0]?.id ?? "");
    setDashboardLocationFilter("all");
    setInventoryResetSignal((value) => value + 1);
  }

  function navButton(id: View, label: string, icon: React.ReactNode) {
    return (
      <button
        className={`nav-item ${view === id ? "active" : ""}`}
        onClick={() => {
          setView(id);
          setNavOpen(false);
        }}
        type="button"
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (!ready) {
    return (
      <main className="loading-shell">
        <Sparkles size={26} />
        <strong>{t(locale, "loadingDemo")}</strong>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Warehouse size={22} /></div>
          <div>
            <strong>{t(locale, "appName")}</strong>
            <span>{state.organization.name}</span>
          </div>
        </div>

        <nav>
          {navButton("dashboard", t(locale, "dashboard"), <BarChart3 size={18} />)}
          {navButton("inventory", t(locale, "inventory"), <Layers3 size={18} />)}
          {navButton("locations", t(locale, "locations"), <MapPin size={18} />)}
          {navButton("settings", t(locale, "settings"), <ShieldCheck size={18} />)}
        </nav>

        <div className="sidebar-card">
          <LockKeyhole size={18} />
          <div>
            <strong>{roleLabel(role)}</strong>
            <span>{t(locale, "demoMode")}</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setNavOpen(!navOpen)} type="button" aria-label="Menu">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <p className="eyebrow"><Sparkles size={14} /> SaaS V1</p>
            <h1>{view === "dashboard" ? t(locale, "dashboard") : view === "inventory" ? t(locale, "inventory") : view === "locations" ? t(locale, "locations") : t(locale, "settings")}</h1>
          </div>
          <div className="topbar-actions">
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label="Language">
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
            <button
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              type="button"
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              <span className="theme-toggle-track" aria-hidden="true">
                <Sun className="theme-icon sun-icon" size={16} />
                <Moon className="theme-icon moon-icon" size={16} />
                <span className="theme-toggle-thumb" />
              </span>
            </button>
            <button className="primary-button" onClick={handleNewItem} type="button">
              <PackagePlus size={18} />
              {t(locale, "newItem")}
            </button>
          </div>
        </header>

        <section className="hero-band">
          <div>
            <p className="eyebrow"><Gauge size={14} /> {t(locale, "operatorFlow")} + {t(locale, "directorView")}</p>
            <h2>{t(locale, "appTagline")}</h2>
          </div>
          <div className="hero-badges">
            <span><DatabaseZap size={16} /> Postgres-ready</span>
            <span><Globe2 size={16} /> Auth0-ready</span>
            <span><Smartphone size={16} /> Mobile-first</span>
          </div>
        </section>

        {storageError && <p className="alert-note">{t(locale, "localStorageError")}</p>}

        {view === "dashboard" && (
          <DashboardView
            locale={locale}
            state={state}
            summary={summary}
            locationFilter={dashboardLocationFilter}
            setLocationFilter={setDashboardLocationFilter}
            setView={setView}
          />
        )}

        {view === "inventory" && (
          <InventoryCardsView
            locale={locale}
            state={state}
            role={role}
            setSelectedId={setSelectedId}
            selectedId={selectedId}
            resetSignal={inventoryResetSignal}
            setItemPatch={setItemPatch}
            handlePhoto={handlePhoto}
            setFrontPhoto={(itemId, photoId) => setState((current) => setFrontPhoto(current, itemId, photoId, role))}
            deactivatePhoto={(itemId, photoId) => setState((current) => deactivatePhoto(current, itemId, photoId, role))}
          />
        )}

        {view === "locations" && (
          <section className="locations-admin">
            <div className="panel">
              <div className="panel-title"><MapPin size={18} /><h3>{t(locale, "locations")}</h3></div>
              <div className="location-admin-list">
                {state.locations.map((location) => (
                  <article key={location.id} className={`location-admin-card ${!location.active ? "inactive" : ""}`}>
                    <div className="location-admin-head">
                      <div>
                        <strong>{location.name}</strong>
                        <span>{state.items.filter((item) => item.locationId === location.id).length} {t(locale, "itemCount")}</span>
                      </div>
                      <button
                        className={`status-button ${location.active ? "active" : ""}`}
                        disabled={!can(role, "edit:locations")}
                        onClick={() => setState((current) => updateLocation(current, location.id, { active: !location.active }))}
                        type="button"
                      >
                        {location.active ? <CheckCircle2 size={16} /> : <CircleOff size={16} />}
                        {location.active ? t(locale, "active") : t(locale, "inactive")}
                      </button>
                    </div>
                    <label>
                      {t(locale, "locationName")}
                      <input
                        disabled={!can(role, "edit:locations")}
                        value={location.name}
                        onChange={(event) => setState((current) => updateLocation(current, location.id, { name: event.target.value }))}
                      />
                    </label>
                    <label>
                      {t(locale, "locationNotes")}
                      <textarea
                        disabled={!can(role, "edit:locations")}
                        value={location.notes}
                        onChange={(event) => setState((current) => updateLocation(current, location.id, { notes: event.target.value }))}
                      />
                    </label>
                  </article>
                ))}
              </div>
            </div>
            <form
              className="panel"
              onSubmit={(event) => {
                event.preventDefault();
                if (!can(role, "edit:locations")) return;
                setState((current) => addLocation(current, newLocationName, newLocationNotes));
                setNewLocationName("");
                setNewLocationNotes("");
              }}
            >
              <div className="panel-title"><PackagePlus size={18} /><h3>{t(locale, "addLocation")}</h3></div>
              <label>
                {t(locale, "locationName")}
                <input disabled={!can(role, "edit:locations")} value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} placeholder="Paris Nord" />
              </label>
              <label>
                {t(locale, "locationNotes")}
                <textarea disabled={!can(role, "edit:locations")} value={newLocationNotes} onChange={(event) => setNewLocationNotes(event.target.value)} placeholder="Stock, showroom, atelier..." />
              </label>
              {!can(role, "edit:locations") && <p className="permission-note">{t(locale, "disabledByRole")}</p>}
              <button className="primary-button wide" disabled={!can(role, "edit:locations")} type="submit">{t(locale, "create")}</button>
            </form>
          </section>
        )}

        {view === "settings" && (
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
                <li><CheckCircle2 size={17} /> Isolation organisation prete dans le schema Postgres</li>
                <li><CheckCircle2 size={17} /> Auth0 prevu pour sessions et organisations</li>
                <li><CheckCircle2 size={17} /> Docker Compose avec Postgres et MinIO</li>
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
        )}
      </section>
    </main>
  );
}

function isView(value: string): value is View {
  return value === "dashboard" || value === "inventory" || value === "locations" || value === "settings";
}

function isRole(value: string | null): value is Role {
  return value === "owner" || value === "admin" || value === "manager" || value === "operator";
}

function DashboardView({
  locale,
  state,
  summary,
  locationFilter,
  setLocationFilter,
  setView,
}: {
  locale: Locale;
  state: InventoryState;
  summary: ReturnType<typeof summarizeInventory>;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  setView: (view: View) => void;
}) {
  return (
    <section className="dashboard-grid">
      <div className="panel span-2">
        <div className="panel-title"><Filter size={18} /><h3>{t(locale, "dashboard")}</h3></div>
        <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
          <option value="all">{t(locale, "allLocations")}</option>
          {state.locations.filter((location) => location.active).map((location) => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
      </div>
      <MetricCard label={t(locale, "totalItems")} value={summary.total} icon={<Warehouse size={22} />} />
      <MetricCard label={t(locale, "missingFront")} value={summary.missingFront} icon={<CircleAlert size={22} />} danger={summary.missingFront > 0} />
      <MetricCard label={t(locale, "activeLocations")} value={state.locations.filter((location) => location.active).length} icon={<MapPin size={22} />} />

      <div className="panel span-2">
        <div className="panel-title"><BarChart3 size={18} /><h3>{t(locale, "status")}</h3></div>
        <div className="status-bars">
          {statuses.map((status) => (
            <button className="status-bar" key={status} onClick={() => setView("inventory")} type="button">
              <span>{statusLabels[locale][status]}</span>
              <div><i style={{ width: `${Math.max(8, (summary.byStatus[status] / Math.max(1, summary.total)) * 100)}%` }} /></div>
              <strong>{summary.byStatus[status]}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><MapPin size={18} /><h3>{t(locale, "locations")}</h3></div>
        <div className="compact-list">
          {summary.byLocation.map((location) => (
            <div key={location.locationId}>
              <span>{location.name}</span>
              <strong>{location.count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><Activity size={18} /><h3>{t(locale, "recentActions")}</h3></div>
        <div className="compact-list">
          {state.actions.slice(0, 5).map((action) => (
            <div key={action.id}>
              <span>{action.type.replaceAll("_", " ")}</span>
              <strong>{new Date(action.at).toLocaleDateString()}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon, danger = false }: { label: string; value: number; icon: React.ReactNode; danger?: boolean }) {
  return (
    <article className={`metric-card ${danger ? "danger" : ""}`}>
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
