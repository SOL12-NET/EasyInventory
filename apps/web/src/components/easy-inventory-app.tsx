"use client";

import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  Layers3,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Sun,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { InventoryCardsView } from "@/components/inventory-cards-view";
import { DashboardView, type View } from "@/components/dashboard-view";
import { LogsView } from "@/components/logs-view";
import { DocumentationView } from "@/components/documentation-view";
import { SettingsView } from "@/components/settings-view";
import { LocationsView } from "@/components/locations-view";
import { cloneDemoState, summarizeInventory } from "@/lib/inventory";
import { t } from "@/lib/i18n";
import { roleLabel, can } from "@/lib/permissions";
import { type InventoryState, type Item, type Locale, type Role, type Location } from "@/lib/types";
import {
  getInventoryStateAction,
  updateItemAction,
  createItemAction,
  updateLocationAction,
  addLocationAction,
  addPhotosToItemAction,
  setFrontPhotoAction,
  deactivatePhotoAction,
  resetDemoAction,
} from "@/app/actions";

const themeStorageKey = "easyinventory.saas.theme";
const roleStorageKey = "easyinventory.saas.demo-role";
const sidebarWidthStorageKey = "easyinventory.saas.sidebar-width";
const sidebarCollapsedStorageKey = "easyinventory.saas.sidebar-collapsed";

export function EasyInventoryApp({ initialView = "dashboard" }: { initialView?: string }) {
  const [state, setState] = useState<InventoryState>(() => cloneDemoState());
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [role, setRole] = useState<Role>("manager");
  const [view, setView] = useState<View>(isView(initialView) ? initialView : "dashboard");
  const [dashboardLocationFilter, setDashboardLocationFilter] = useState("all");
  const [statusChartMode, setStatusChartMode] = useState<"lines" | "pie">("lines");
  const [selectedId, setSelectedId] = useState("item-1001");
  const [inventoryResetSignal, setInventoryResetSignal] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Sidebar sizing & collapse state
  const [sidebarWidth, setSidebarWidth] = useState(286);
  const [collapsed, setCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Initialize and load state from server
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const serverState = await getInventoryStateAction();
        if (active) {
          setState(serverState);
        }
      } catch (err) {
        console.error("Failed to load server state:", err);
      }

      try {
        const savedTheme = window.localStorage.getItem(themeStorageKey);
        const savedRole = window.localStorage.getItem(roleStorageKey);
        const savedWidth = window.localStorage.getItem(sidebarWidthStorageKey);
        const savedCollapsed = window.localStorage.getItem(sidebarCollapsedStorageKey);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (active) {
          setTheme(savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light");
          if (isRole(savedRole)) setRole(savedRole);
          if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
          if (savedCollapsed) setCollapsed(savedCollapsed === "true");
        }
      } catch {
        if (active) setStorageError(true);
      } finally {
        if (active) setReady(true);
      }
    }
    init();

    return () => {
      active = false;
    };
  }, []);

  // Save theme and role in localStorage
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

  // Save sidebar configuration in localStorage
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(sidebarWidthStorageKey, String(sidebarWidth));
      window.localStorage.setItem(sidebarCollapsedStorageKey, String(collapsed));
    } catch {
      setStorageError(true);
    }
  }, [ready, sidebarWidth, collapsed]);

  // Keyboard shortcut Ctrl+\ to collapse/expand sidebar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "\\") {
        event.preventDefault();
        setCollapsed((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function startResizing(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!isResizing) return;
    const newWidth = event.clientX;
    if (newWidth < 140) {
      setCollapsed(true);
      setSidebarWidth(180);
    } else {
      setCollapsed(false);
      setSidebarWidth(Math.min(450, Math.max(180, newWidth)));
    }
  }

  function stopResizing(event: React.PointerEvent<HTMLDivElement>) {
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const selectedItem = state.items.find((item) => item.id === selectedId) ?? state.items[0] ?? null;
  const summary = useMemo(() => summarizeInventory(state, dashboardLocationFilter), [state, dashboardLocationFilter]);

  async function setItemPatch(patch: Partial<Item>, action = "EDIT_ITEM") {
    if (!selectedItem) return;
    try {
      const nextState = await updateItemAction(selectedItem.id, patch, action, role);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleNewItem() {
    const locationId = state.locations.find((location) => location.active)?.id;
    if (!locationId) return;
    try {
      const nextState = await createItemAction(locationId, role);
      setState(nextState);
      setSelectedId(nextState.items[0]?.id ?? selectedId);
      setInventoryResetSignal((value) => value + 1);
      setView("inventory");
    } catch {
      setStorageError(true);
    }
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !selectedItem || !can(role, "add:photos")) return;
    try {
      const photoPayloads = await Promise.all(
        files.map((file) =>
          new Promise<{ url: string; originalName: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: String(reader.result), originalName: file.name });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
        ),
      );
      const nextState = await addPhotosToItemAction(selectedItem.id, photoPayloads, role);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
    event.target.value = "";
  }

  async function handleSetFrontPhoto(itemId: string, photoId: string) {
    try {
      const nextState = await setFrontPhotoAction(itemId, photoId, role);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleDeactivatePhoto(itemId: string, photoId: string) {
    try {
      const nextState = await deactivatePhotoAction(itemId, photoId, role);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleUpdateLocation(locationId: string, patch: Partial<Location>) {
    try {
      const nextState = await updateLocationAction(locationId, patch);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function handleAddLocation(name: string, notes: string) {
    try {
      const nextState = await addLocationAction(name, notes);
      setState(nextState);
    } catch {
      setStorageError(true);
    }
  }

  async function resetDemo() {
    try {
      const nextState = await resetDemoAction();
      setState(nextState);
      setSelectedId(nextState.items[0]?.id ?? "");
      setDashboardLocationFilter("all");
      setInventoryResetSignal((value) => value + 1);
    } catch {
      setStorageError(true);
    }
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
    <main
      className={`app-shell ${isResizing ? "resizing" : ""}`}
      style={{ "--sidebar-width": collapsed ? "0px" : `${sidebarWidth}px` } as any}
    >
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${navOpen ? "open" : ""} ${isResizing ? "resizing" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark"><Warehouse size={22} /></div>
            <div>
              <strong>{t(locale, "appName")}</strong>
              <span>{state.organization.name}</span>
            </div>
          </div>
          <button
            className="sidebar-collapse-btn desktop-only"
            onClick={() => setCollapsed(true)}
            title={locale === "fr" ? "Replier le menu (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav>
          {navButton("dashboard", t(locale, "dashboard"), <BarChart3 size={18} />)}
          {navButton("inventory", t(locale, "inventory"), <Layers3 size={18} />)}
          {navButton("logs", t(locale, "logs"), <ActivityIcon size={18} />)}
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

      <div
        className={`sidebar-resizer ${isResizing ? "is-resizing" : ""} ${collapsed ? "collapsed" : ""}`}
        onPointerDown={startResizing}
        onPointerMove={handleResize}
        onPointerUp={stopResizing}
        onPointerCancel={stopResizing}
      />

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setNavOpen(!navOpen)} type="button" aria-label="Menu">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {collapsed && (
            <button
              className="icon-button desktop-only expand-sidebar-btn"
              onClick={() => setCollapsed(false)}
              type="button"
              title={locale === "fr" ? "Déployer le menu (Ctrl+\\)" : "Expand sidebar (Ctrl+\\)"}
              style={{ marginRight: "12px" }}
            >
              <Menu size={20} />
            </button>
          )}
          <div>
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
            <h2>{t(locale, "appTagline")}</h2>
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
            setFrontPhoto={handleSetFrontPhoto}
            deactivatePhoto={handleDeactivatePhoto}
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
          <LocationsView
            locale={locale}
            role={role}
            state={state}
            onUpdateLocation={handleUpdateLocation}
            onAddLocation={handleAddLocation}
          />
        )}

        {view === "settings" && (
          <SettingsView
            locale={locale}
            role={role}
            setRole={setRole}
            resetDemo={resetDemo}
          />
        )}
      </section>
    </main>
  );
}

function ActivityIcon({ size }: { size: number }) {
  // Simple SVG replacement to avoid importing a different icon under a conflicting name
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-activity"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
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
