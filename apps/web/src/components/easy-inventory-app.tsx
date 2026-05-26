"use client";

import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CircleOff,
  Edit3,
  Filter,
  Gauge,
  Layers3,
  LineChart,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  PackagePlus,
  PieChart,
  ShieldCheck,
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
import { actionLabel, statusLabels, t } from "@/lib/i18n";
import { can, roleLabel } from "@/lib/permissions";
import { statuses, type InventoryAction, type InventoryState, type Item, type ItemStatus, type Locale, type Role } from "@/lib/types";

type View = "dashboard" | "inventory" | "logs" | "documentation" | "locations" | "settings";
type Theme = "light" | "dark";
type StatusChartMode = "lines" | "pie";

const storageKey = "easyinventory.saas.demo-state";
const themeStorageKey = "easyinventory.saas.theme";
const roleStorageKey = "easyinventory.saas.demo-role";
const statusColors: Record<ItemStatus, string> = {
  AVAILABLE: "#0f766e",
  RENTED: "#2563eb",
  REPAIR: "#d97706",
  SOLD: "#475569",
  LOST: "#dc2626",
  DUPLICATE: "#94a3b8",
};

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
  const [statusChartMode, setStatusChartMode] = useState<StatusChartMode>("lines");
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
          {navButton("logs", t(locale, "logs"), <Activity size={18} />)}
          {navButton("documentation", t(locale, "documentation"), <BookOpen size={18} />)}
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
            <h1>{viewTitle(locale, view)}</h1>
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
            <span><ShieldCheck size={16} /> {t(locale, "roleControl")}</span>
            <span><BookOpen size={16} /> {t(locale, "guidedDocs")}</span>
            <span><Activity size={16} /> {t(locale, "actionTrace")}</span>
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
            chartMode={statusChartMode}
            setChartMode={setStatusChartMode}
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

        {view === "logs" && (
          <LogsView
            locale={locale}
            state={state}
            setSelectedId={setSelectedId}
            setView={setView}
          />
        )}

        {view === "documentation" && <DocumentationView />}

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
        )}
      </section>
    </main>
  );
}

function isView(value: string): value is View {
  return value === "dashboard" || value === "inventory" || value === "logs" || value === "documentation" || value === "locations" || value === "settings";
}

function isRole(value: string | null): value is Role {
  return value === "owner" || value === "admin" || value === "manager" || value === "operator";
}

function viewTitle(locale: Locale, view: View) {
  return {
    dashboard: t(locale, "dashboard"),
    inventory: t(locale, "inventory"),
    logs: t(locale, "logs"),
    documentation: t(locale, "documentation"),
    locations: t(locale, "locations"),
    settings: t(locale, "settings"),
  }[view];
}

function DashboardView({
  locale,
  state,
  summary,
  locationFilter,
  setLocationFilter,
  setView,
  chartMode,
  setChartMode,
}: {
  locale: Locale;
  state: InventoryState;
  summary: ReturnType<typeof summarizeInventory>;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  setView: (view: View) => void;
  chartMode: StatusChartMode;
  setChartMode: (value: StatusChartMode) => void;
}) {
  const pieSegments = buildStatusPieSegments(summary.byStatus, summary.total);

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
        <div className="panel-title split-title">
          <div><BarChart3 size={18} /><h3>{t(locale, "status")}</h3></div>
          <div className="segmented-control" aria-label={t(locale, "statusChartMode")}>
            <button className={chartMode === "lines" ? "active" : ""} onClick={() => setChartMode("lines")} type="button">
              <LineChart size={15} />
              {t(locale, "chartLines")}
            </button>
            <button className={chartMode === "pie" ? "active" : ""} onClick={() => setChartMode("pie")} type="button">
              <PieChart size={15} />
              {t(locale, "chartPie")}
            </button>
          </div>
        </div>
        {chartMode === "lines" ? (
          <div className="status-bars">
            {statuses.map((status) => {
              const count = summary.byStatus[status];
              const width = summary.total === 0 ? 0 : (count / summary.total) * 100;
              return (
                <button className={`status-bar ${count === 0 ? "is-zero" : ""}`} key={status} onClick={() => setView("inventory")} type="button">
                  <span>{statusLabels[locale][status]}</span>
                  <div><i style={{ width: `${width}%`, background: statusColors[status] }} /></div>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="status-pie-layout">
            <button
              className="status-pie"
              onClick={() => setView("inventory")}
              style={{ background: pieSegments.length ? `conic-gradient(${pieSegments.join(", ")})` : "var(--media-bg)" }}
              type="button"
              aria-label={t(locale, "status")}
            >
              <span>{summary.total}</span>
              <small>{t(locale, "totalItems")}</small>
            </button>
            <div className="status-legend">
              {statuses.map((status) => (
                <button key={status} onClick={() => setView("inventory")} type="button">
                  <i style={{ background: statusColors[status] }} />
                  <span>{statusLabels[locale][status]}</span>
                  <strong>{summary.byStatus[status]}</strong>
                </button>
              ))}
            </div>
          </div>
        )}
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

      <div className="panel recent-actions-panel">
        <button className="panel-title action-title" onClick={() => setView("logs")} type="button">
          <span><Activity size={18} /><h3>{t(locale, "recentActions")}</h3></span>
          <strong>{t(locale, "viewAll")}</strong>
        </button>
        <div className="compact-list">
          {state.actions.slice(0, 5).map((action) => (
            <div key={action.id}>
              <span>{actionLabel(locale, action.type)}</span>
              <strong>{new Date(action.at).toLocaleDateString()}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildStatusPieSegments(byStatus: Record<ItemStatus, number>, total: number) {
  if (total <= 0) return [];
  let cursor = 0;
  return statuses.flatMap((status) => {
    const count = byStatus[status];
    if (count <= 0) return [];
    const start = cursor;
    const end = cursor + (count / total) * 360;
    cursor = end;
    return `${statusColors[status]} ${start}deg ${end}deg`;
  });
}

function LogsView({
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
      <div className="panel logs-hero">
        <div>
          <p className="eyebrow"><Activity size={14} /> {t(locale, "logs")}</p>
          <h2>{t(locale, "logsTitle")}</h2>
          <p>{t(locale, "logsIntro")}</p>
        </div>
        <strong>{actions.length}</strong>
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

function DocumentationView() {
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

function MetricCard({ label, value, icon, danger = false }: { label: string; value: number; icon: React.ReactNode; danger?: boolean }) {
  return (
    <article className={`metric-card ${danger ? "danger" : ""}`}>
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
