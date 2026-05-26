"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  DatabaseZap,
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
import { addLocation, cloneDemoState, createItem, summarizeInventory, updateItem } from "@/lib/inventory";
import { statusLabels, t } from "@/lib/i18n";
import { statuses, type InventoryState, type Item, type Locale } from "@/lib/types";

type View = "dashboard" | "inventory" | "locations" | "settings";
type Theme = "light" | "dark";

const storageKey = "easyinventory.saas.demo-state";
const themeStorageKey = "easyinventory.saas.theme";

function loadState() {
  if (typeof window === "undefined") return cloneDemoState();
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return cloneDemoState();
  try {
    return JSON.parse(saved) as InventoryState;
  } catch {
    return cloneDemoState();
  }
}

export function EasyInventoryApp({ initialView = "dashboard" }: { initialView?: string }) {
  const [state, setState] = useState<InventoryState>(() => cloneDemoState());
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView] = useState<View>(isView(initialView) ? initialView : "dashboard");
  const [dashboardLocationFilter, setDashboardLocationFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("item-1001");
  const [inventoryResetSignal, setInventoryResetSignal] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");

  useEffect(() => {
    setState(loadState());
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light");
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [ready, state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (ready) window.localStorage.setItem(themeStorageKey, theme);
  }, [ready, theme]);

  const selectedItem = state.items.find((item) => item.id === selectedId) ?? state.items[0] ?? null;
  const summary = useMemo(() => summarizeInventory(state, dashboardLocationFilter), [state, dashboardLocationFilter]);

  function setItemPatch(patch: Partial<Item>, action = "EDIT_ITEM") {
    if (!selectedItem) return;
    setState((current) => updateItem(current, selectedItem.id, patch, action));
  }

  function handleNewItem() {
    const locationId = state.locations[0]?.id;
    if (!locationId) return;
    setState((current) => {
      const next = createItem(current, locationId);
      setSelectedId(next.items[0]?.id ?? selectedId);
      return next;
    });
    setInventoryResetSignal((value) => value + 1);
    setView("inventory");
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedItem) return;
    const reader = new FileReader();
    reader.onload = () => {
      const at = new Date().toISOString();
      const photo = {
        id: crypto.randomUUID(),
        itemId: selectedItem.id,
        url: String(reader.result),
        originalName: file.name,
        active: true,
        createdAt: at,
      };
      setState((current) => ({
        ...current,
        photos: [photo, ...current.photos],
        items: current.items.map((item) =>
          item.id === selectedItem.id ? { ...item, frontPhotoId: item.frontPhotoId ?? photo.id, updatedAt: at } : item,
        ),
        actions: [
          { id: crypto.randomUUID(), itemId: selectedItem.id, type: "NEW_UPLOAD", actor: "operator", at },
          ...current.actions,
        ],
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
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
            <strong>{t(locale, "authReady")}</strong>
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
            setSelectedId={setSelectedId}
            selectedId={selectedId}
            resetSignal={inventoryResetSignal}
            setItemPatch={setItemPatch}
            handlePhoto={handlePhoto}
          />
        )}

        {view === "locations" && (
          <section className="two-column locations-view">
            <div className="panel">
              <div className="panel-title">
                <MapPin size={18} />
                <h3>{t(locale, "locations")}</h3>
              </div>
              <div className="location-list">
                {state.locations.map((location) => (
                  <article key={location.id} className="location-row">
                    <div>
                      <strong>{location.name}</strong>
                      <span>{location.notes || "Aucune note"}</span>
                    </div>
                    <span className="pill ok">{state.items.filter((item) => item.locationId === location.id).length} items</span>
                  </article>
                ))}
              </div>
            </div>
            <form
              className="panel"
              onSubmit={(event) => {
                event.preventDefault();
                setState((current) => addLocation(current, newLocationName));
                setNewLocationName("");
              }}
            >
              <div className="panel-title">
                <PackagePlus size={18} />
                <h3>{t(locale, "addLocation")}</h3>
              </div>
              <label>
                {t(locale, "locationName")}
                <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} placeholder="Paris Nord" />
              </label>
              <button className="primary-button wide" type="submit">{t(locale, "save")}</button>
            </form>
          </section>
        )}

        {view === "settings" && (
          <section className="settings-grid">
            <article className="panel">
              <div className="panel-title"><ShieldCheck size={18} /><h3>Contrôle SaaS</h3></div>
              <ul className="check-list">
                <li><CheckCircle2 size={17} /> Isolation organisation prête dans le schéma Postgres</li>
                <li><CheckCircle2 size={17} /> Auth0 prévu pour sessions et organisations</li>
                <li><CheckCircle2 size={17} /> Docker Compose avec Postgres et MinIO</li>
                <li><CheckCircle2 size={17} /> Mode démo local utilisable sans secrets</li>
              </ul>
            </article>
            <article className="panel dark-panel">
              <Activity size={24} />
              <h3>Score opérationnel</h3>
              <strong>98%</strong>
              <span>Inventaire prêt pour validation métier V1</span>
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
        <div className="panel-title">
          <Filter size={18} />
          <h3>{t(locale, "dashboard")}</h3>
        </div>
        <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
          <option value="all">{t(locale, "allLocations")}</option>
          {state.locations.map((location) => (
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
