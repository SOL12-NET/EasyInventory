"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleOff,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  LineChart,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  PackagePlus,
  PieChart,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type DragEvent, type PointerEvent, type ReactNode } from "react";
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
type LocationChartMode = "bars" | "pie";
type ActionRange = "24h" | "7d" | "30d";
type TranslationKey = Parameters<typeof t>[1];
type DashboardWidgetId = "scope" | "inventory" | "photos" | "status" | "locations" | "actions";
type DashboardLayoutState = {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
};
type DashboardPointerDrag = {
  id: DashboardWidgetId;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  active: boolean;
  lastMoveAt: number;
  lastTarget?: DashboardWidgetId;
};

const storageKey = "easyinventory.saas.demo-state";
const themeStorageKey = "easyinventory.saas.theme";
const roleStorageKey = "easyinventory.saas.demo-role";
const dashboardLayoutStorageKey = "easyinventory.saas.dashboard-layout";
const dashboardWidgetIds: DashboardWidgetId[] = ["scope", "inventory", "photos", "status", "locations", "actions"];
const defaultDashboardLayout: DashboardLayoutState = { order: dashboardWidgetIds, hidden: [] };
const dashboardWidgetSpans: Record<DashboardWidgetId, 1 | 2> = {
  scope: 2,
  inventory: 1,
  photos: 1,
  status: 2,
  locations: 2,
  actions: 2,
};
const dashboardWidgetLabels: Record<DashboardWidgetId, TranslationKey> = {
  scope: "dashboardScopeWidget",
  inventory: "trackedItems",
  photos: "frontPhotoCoverage",
  status: "status",
  locations: "locations",
  actions: "recentActions",
};
const statusColors: Record<ItemStatus, string> = {
  AVAILABLE: "#14b8a6",
  RENTED: "#60a5fa",
  REPAIR: "#f59e0b",
  SOLD: "#475569",
  LOST: "#f43f5e",
  DUPLICATE: "#94a3b8",
};
const actionColors = ["#14b8a6", "#60a5fa", "#f59e0b", "#f43f5e", "#a78bfa", "#22c55e", "#e879f9", "#64748b"];
const locationColors = ["#14b8a6", "#60a5fa", "#f59e0b", "#a78bfa", "#22c55e"];
const actionRanges: Record<ActionRange, { buckets: number; stepMs: number }> = {
  "24h": { buckets: 24, stepMs: 60 * 60 * 1000 },
  "7d": { buckets: 7, stepMs: 24 * 60 * 60 * 1000 },
  "30d": { buckets: 30, stepMs: 24 * 60 * 60 * 1000 },
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

function normalizeDashboardLayout(layout?: Partial<DashboardLayoutState>): DashboardLayoutState {
  const incomingOrder = Array.isArray(layout?.order) ? layout.order : [];
  const order = [
    ...incomingOrder.filter((id, index): id is DashboardWidgetId => dashboardWidgetIds.includes(id as DashboardWidgetId) && incomingOrder.indexOf(id) === index),
    ...dashboardWidgetIds.filter((id) => !incomingOrder.includes(id)),
  ];
  const incomingHidden = Array.isArray(layout?.hidden) ? layout.hidden : [];
  const hidden = incomingHidden.filter((id, index): id is DashboardWidgetId => dashboardWidgetIds.includes(id as DashboardWidgetId) && incomingHidden.indexOf(id) === index);
  return { order, hidden: hidden.length >= dashboardWidgetIds.length ? [] : hidden };
}

function loadDashboardLayout() {
  if (typeof window === "undefined") return defaultDashboardLayout;
  try {
    return normalizeDashboardLayout(JSON.parse(window.localStorage.getItem(dashboardLayoutStorageKey) ?? "null") ?? defaultDashboardLayout);
  } catch {
    return defaultDashboardLayout;
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
  const selectedLocation = state.locations.find((location) => location.id === locationFilter);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutState>(defaultDashboardLayout);
  const [dashboardLayoutReady, setDashboardLayoutReady] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<DashboardWidgetId | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<DashboardWidgetId | null>(null);
  const [activeMoveWidget, setActiveMoveWidget] = useState<DashboardWidgetId | null>(null);
  const [pointerDrag, setPointerDrag] = useState<DashboardPointerDrag | null>(null);
  const widgetRefs = useRef(new Map<DashboardWidgetId, HTMLDivElement>());
  const pointerDragRef = useRef<DashboardPointerDrag | null>(null);
  const suppressHandleClickRef = useRef(false);
  const visibleWidgets = dashboardLayout.order.filter((id) => !dashboardLayout.hidden.includes(id));

  useEffect(() => {
    setDashboardLayout(loadDashboardLayout());
    setDashboardLayoutReady(true);
  }, []);

  useEffect(() => {
    if (dashboardLayoutReady) window.localStorage.setItem(dashboardLayoutStorageKey, JSON.stringify(dashboardLayout));
  }, [dashboardLayout, dashboardLayoutReady]);

  useEffect(() => {
    pointerDragRef.current = pointerDrag;
  }, [pointerDrag?.id]);

  useEffect(() => {
    if (!pointerDrag) return;

    function handlePointerMove(event: globalThis.PointerEvent) {
      const current = pointerDragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const distanceX = event.clientX - current.startX;
      const distanceY = event.clientY - current.startY;
      const active = current.active || Math.hypot(distanceX, distanceY) > 6;
      const next = { ...current, x: event.clientX, y: event.clientY, active };
      pointerDragRef.current = next;
      setPointerDrag(next);
      if (!active) return;

      const target = getStableWidgetTarget(event.clientX, event.clientY, current.id);
      if (!target) {
        setDragOverWidget(null);
        return;
      }

      const now = window.performance.now();
      if (target !== current.lastTarget && now - current.lastMoveAt > 130) {
        const moved = { ...next, lastMoveAt: now, lastTarget: target };
        pointerDragRef.current = moved;
        setPointerDrag(moved);
        setDragOverWidget(target);
        moveDashboardWidget(current.id, target, { clearMove: false, skipAnimationFor: current.id });
      }
    }

    function handlePointerEnd(event: globalThis.PointerEvent) {
      const current = pointerDragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      suppressHandleClickRef.current = current.active;
      window.setTimeout(() => {
        suppressHandleClickRef.current = false;
      }, 0);
      pointerDragRef.current = null;
      setPointerDrag(null);
      setDraggedWidget(null);
      setDragOverWidget(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [pointerDrag?.id]);

  function getWidgetRects() {
    const rects = new Map<DashboardWidgetId, DOMRect>();
    widgetRefs.current.forEach((node, id) => rects.set(id, node.getBoundingClientRect()));
    return rects;
  }

  function animateWidgetLayout(firstRects: Map<DashboardWidgetId, DOMRect>, skipId?: DashboardWidgetId) {
    window.requestAnimationFrame(() => {
      const lastRects = getWidgetRects();
      widgetRefs.current.forEach((node, id) => {
        if (id === skipId) return;
        const first = firstRects.get(id);
        const last = lastRects.get(id);
        if (!first || !last) return;
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
        node.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      });
    });
  }

  function getMovedWidgetOrder(order: DashboardWidgetId[], source: DashboardWidgetId, target: DashboardWidgetId) {
    const sourceIndex = order.indexOf(source);
    const originalTargetIndex = order.indexOf(target);
    const nextOrder = order.filter((id) => id !== source);
    const targetIndex = nextOrder.indexOf(target);
    const insertIndex = targetIndex < 0 ? nextOrder.length : sourceIndex < originalTargetIndex ? targetIndex + 1 : targetIndex;
    nextOrder.splice(insertIndex, 0, source);
    return nextOrder;
  }

  function getFloatingWidgetStyle(drag: DashboardPointerDrag | null, id: DashboardWidgetId): CSSProperties | undefined {
    if (!drag || drag.id !== id || !drag.active) return undefined;
    const viewportWidth = typeof window === "undefined" ? drag.width : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? drag.height : window.innerHeight;
    const margin = 12;
    const maxLeft = Math.max(margin, viewportWidth - drag.width - margin);
    const maxTop = Math.max(margin, viewportHeight - drag.height - margin);
    const left = Math.min(Math.max(margin, drag.x - drag.offsetX), maxLeft);
    const top = Math.min(Math.max(margin, drag.y - drag.offsetY), maxTop);
    return {
      height: drag.height,
      left,
      position: "fixed",
      top,
      width: drag.width,
      zIndex: 50,
    };
  }

  function moveDashboardWidget(source: DashboardWidgetId, target: DashboardWidgetId, options: { clearMove?: boolean; skipAnimationFor?: DashboardWidgetId } = {}) {
    if (source === target) return;
    const firstRects = getWidgetRects();
    setDashboardLayout((current) => {
      const order = getMovedWidgetOrder(current.order, source, target);
      if (order.join("|") === current.order.join("|")) return current;
      return { ...current, order };
    });
    animateWidgetLayout(firstRects, options.skipAnimationFor);
    if (options.clearMove !== false) setActiveMoveWidget(null);
  }

  function toggleDashboardWidget(id: DashboardWidgetId) {
    setDashboardLayout((current) => {
      const isHidden = current.hidden.includes(id);
      if (!isHidden && current.order.filter((widgetId) => !current.hidden.includes(widgetId)).length <= 1) return current;
      return {
        ...current,
        hidden: isHidden ? current.hidden.filter((widgetId) => widgetId !== id) : [...current.hidden, id],
      };
    });
  }

  function resetDashboardLayout() {
    setDashboardLayout(defaultDashboardLayout);
    setDraggedWidget(null);
    setDragOverWidget(null);
    setActiveMoveWidget(null);
    setPointerDrag(null);
  }

  function shiftDashboardWidget(id: DashboardWidgetId, direction: -1 | 1) {
    const firstRects = getWidgetRects();
    setDashboardLayout((current) => {
      const visible = current.order.filter((widgetId) => !current.hidden.includes(widgetId));
      const index = visible.indexOf(id);
      const target = visible[index + direction];
      if (!target) return current;
      const order = current.order.filter((widgetId) => widgetId !== id);
      const targetIndex = order.indexOf(target);
      order.splice(direction < 0 ? targetIndex : targetIndex + 1, 0, id);
      return { ...current, order };
    });
    animateWidgetLayout(firstRects);
  }

  function getStableWidgetTarget(x: number, y: number, ignoreId: DashboardWidgetId) {
    let fallback: { id: DashboardWidgetId; distance: number } | null = null;
    for (const id of visibleWidgets) {
      if (id === ignoreId) continue;
      const node = widgetRefs.current.get(id);
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(x - centerX, y - centerY);
      if (!fallback || distance < fallback.distance) fallback = { id, distance };

      const insetX = Math.min(44, rect.width * 0.18);
      const insetY = Math.min(44, rect.height * 0.18);
      const insideStableZone = x >= rect.left + insetX && x <= rect.right - insetX && y >= rect.top + insetY && y <= rect.bottom - insetY;
      if (insideStableZone) return id;
    }
    return fallback && fallback.distance < 74 ? fallback.id : null;
  }

  function registerDashboardWidget(id: DashboardWidgetId, node: HTMLDivElement | null) {
    if (node) {
      widgetRefs.current.set(id, node);
      return;
    }
    widgetRefs.current.delete(id);
  }

  function startPointerWidgetDrag(id: DashboardWidgetId, event: PointerEvent<HTMLButtonElement>) {
    const frame = widgetRefs.current.get(id);
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const dragState = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      offsetX: rect.width / 2,
      offsetY: rect.height / 2,
      width: rect.width,
      height: rect.height,
      active: false,
      lastMoveAt: 0,
    };
    pointerDragRef.current = dragState;
    setPointerDrag(dragState);
    setDraggedWidget(id);
    setActiveMoveWidget(null);
  }

  function renderDashboardWidget(id: DashboardWidgetId) {
    switch (id) {
      case "scope":
        return (
          <div className="panel dashboard-filter-panel">
            <div className="panel-title"><Filter size={18} /><h3>{t(locale, "dashboard")}</h3></div>
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
              <option value="all">{t(locale, "allLocations")}</option>
              {state.locations.filter((location) => location.active).map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
            <div className="dashboard-scope">
              <span>{t(locale, "dashboardScope")}</span>
              <strong>{selectedLocation?.name ?? t(locale, "allLocations")}</strong>
              <p>{summary.total} {t(locale, "scopedItems")}</p>
            </div>
          </div>
        );
      case "inventory":
        return <InventoryInsightCardV2 locale={locale} summary={summary} setView={setView} />;
      case "photos":
        return <PhotoCoverageCardV2 locale={locale} summary={summary} setView={setView} />;
      case "status":
        return (
          <div className="panel">
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
        );
      case "locations":
        return <LocationOverviewCardV2 locale={locale} state={state} setView={setView} />;
      case "actions":
        return (
          <div className="panel recent-actions-panel">
            <button className="panel-title action-title" onClick={() => setView("logs")} type="button">
              <span><Activity size={18} /><h3>{t(locale, "recentActions")}</h3></span>
              <strong>{t(locale, "viewAll")}</strong>
            </button>
            <ActionActivityChart actions={state.actions} locale={locale} />
            <div className="compact-list">
              {state.actions.slice(0, 5).map((action) => (
                <div key={action.id}>
                  <span>{actionLabel(locale, action.type)}</span>
                  <strong>{new Date(action.at).toLocaleDateString()}</strong>
                </div>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <section className="dashboard-grid">
      <div className="dashboard-command-bar span-4">
        <div>
          <h2>{t(locale, "dashboard")}</h2>
          <span>{visibleWidgets.length}/{dashboardWidgetIds.length}</span>
        </div>
        <button className={`dashboard-customize-button ${customizerOpen ? "active" : ""}`} onClick={() => setCustomizerOpen((current) => !current)} type="button">
          <SlidersHorizontal size={16} />
          {t(locale, "customizeDashboard")}
        </button>
      </div>

      {customizerOpen && (
        <div className="panel dashboard-customizer-panel span-4">
          <div className="panel-title split-title">
            <div><SlidersHorizontal size={18} /><h3>{t(locale, "dashboardCustomization")}</h3></div>
            <button
              className="secondary-tool-button"
              onClick={resetDashboardLayout}
              type="button"
            >
              <RotateCcw size={15} />
              {t(locale, "resetLayout")}
            </button>
          </div>
          <div className="dashboard-widget-toggle-grid">
            {dashboardLayout.order.map((id) => {
              const active = !dashboardLayout.hidden.includes(id);
              return (
                <button className={active ? "active" : ""} key={id} onClick={() => toggleDashboardWidget(id)} type="button">
                  {active ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>{t(locale, dashboardWidgetLabels[id])}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {visibleWidgets.map((id) => (
        <DashboardWidgetFrame
          id={id}
          key={id}
          locale={locale}
          registerWidget={registerDashboardWidget}
          span={dashboardWidgetSpans[id]}
          title={t(locale, dashboardWidgetLabels[id])}
          placeholderStyle={pointerDrag?.id === id && pointerDrag.active ? {
            height: pointerDrag.height,
          } : undefined}
          dragStyle={getFloatingWidgetStyle(pointerDrag, id)}
          isDragging={draggedWidget === id || pointerDrag?.id === id}
          isPointerDragging={pointerDrag?.id === id && pointerDrag.active}
          isDragOver={dragOverWidget === id && draggedWidget !== id}
          isMoveSource={activeMoveWidget === id}
          isMoveTarget={Boolean(activeMoveWidget && activeMoveWidget !== id)}
          onDragStart={(widgetId, event) => {
            setDraggedWidget(widgetId);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", widgetId);
          }}
          onDragOver={(widgetId, event) => {
            const source = (event.dataTransfer.getData("text/plain") || draggedWidget) as DashboardWidgetId | null;
            if (!source || source === widgetId) return;
            event.preventDefault();
            setDragOverWidget(widgetId);
          }}
          onDrop={(widgetId, event) => {
            event.preventDefault();
            const source = (event.dataTransfer.getData("text/plain") || draggedWidget) as DashboardWidgetId | null;
            if (source && dashboardWidgetIds.includes(source)) moveDashboardWidget(source, widgetId);
            setDraggedWidget(null);
            setDragOverWidget(null);
          }}
          onDragEnd={() => {
            setDraggedWidget(null);
            setDragOverWidget(null);
          }}
          onMovePrevious={(widgetId) => shiftDashboardWidget(widgetId, -1)}
          onMoveNext={(widgetId) => shiftDashboardWidget(widgetId, 1)}
          canMovePrevious={visibleWidgets.indexOf(id) > 0}
          canMoveNext={visibleWidgets.indexOf(id) < visibleWidgets.length - 1}
          onActivateMove={(widgetId) => {
            if (suppressHandleClickRef.current) return;
            setActiveMoveWidget((current) => (current === widgetId ? null : widgetId));
          }}
          onPointerStart={startPointerWidgetDrag}
          onMoveTarget={(widgetId) => {
            if (!activeMoveWidget) return;
            if (activeMoveWidget === widgetId) {
              setActiveMoveWidget(null);
              return;
            }
            moveDashboardWidget(activeMoveWidget, widgetId);
          }}
        >
          {renderDashboardWidget(id)}
        </DashboardWidgetFrame>
      ))}

      {visibleWidgets.length === 0 && (
        <div className="panel empty-state span-4">
          <h3>{t(locale, "emptyDashboard")}</h3>
          <button className="primary-button" onClick={resetDashboardLayout} type="button">
            <RotateCcw size={17} />
            {t(locale, "resetLayout")}
          </button>
        </div>
      )}
    </section>
  );
}

function DashboardWidgetFrame({
  id,
  locale,
  registerWidget,
  span,
  title,
  placeholderStyle,
  dragStyle,
  isDragging,
  isPointerDragging,
  isDragOver,
  isMoveSource,
  isMoveTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMovePrevious,
  onMoveNext,
  canMovePrevious,
  canMoveNext,
  onActivateMove,
  onPointerStart,
  onMoveTarget,
  children,
}: {
  id: DashboardWidgetId;
  locale: Locale;
  registerWidget: (id: DashboardWidgetId, node: HTMLDivElement | null) => void;
  span: 1 | 2;
  title: string;
  placeholderStyle?: CSSProperties;
  dragStyle?: CSSProperties;
  isDragging: boolean;
  isPointerDragging: boolean;
  isDragOver: boolean;
  isMoveSource: boolean;
  isMoveTarget: boolean;
  onDragStart: (id: DashboardWidgetId, event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (id: DashboardWidgetId, event: DragEvent<HTMLDivElement>) => void;
  onDrop: (id: DashboardWidgetId, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onMovePrevious: (id: DashboardWidgetId) => void;
  onMoveNext: (id: DashboardWidgetId) => void;
  canMovePrevious: boolean;
  canMoveNext: boolean;
  onActivateMove: (id: DashboardWidgetId) => void;
  onPointerStart: (id: DashboardWidgetId, event: PointerEvent<HTMLButtonElement>) => void;
  onMoveTarget: (id: DashboardWidgetId) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`dashboard-widget-frame ${span === 2 ? "span-2" : ""} ${isDragging ? "is-dragging" : ""} ${isPointerDragging ? "is-pointer-dragging" : ""} ${isDragOver ? "is-drag-over" : ""} ${isMoveSource ? "is-move-source" : ""} ${isMoveTarget ? "is-move-target" : ""}`}
      data-dashboard-widget-id={id}
      onDragOver={(event) => onDragOver(id, event)}
      onDrop={(event) => onDrop(id, event)}
      ref={(node) => registerWidget(id, node)}
      style={placeholderStyle}
    >
      <div className="dashboard-widget-surface" style={dragStyle}>
        <button
          aria-label={`${t(locale, "moveWidget")} ${title}`}
          className="dashboard-drag-handle"
          title={t(locale, "moveWidget")}
          onDragStart={(event) => onDragStart(id, event)}
          onDragEnd={onDragEnd}
          onClick={(event) => {
            event.preventDefault();
            onActivateMove(id);
          }}
          onPointerDown={(event) => onPointerStart(id, event)}
          type="button"
        >
          <GripVertical size={15} />
        </button>
        <div className="dashboard-widget-order-controls">
          <button aria-label={`${t(locale, "moveWidgetPrevious")} ${title}`} disabled={!canMovePrevious} onClick={() => onMovePrevious(id)} type="button">
            <ArrowLeft size={14} />
          </button>
          <button aria-label={`${t(locale, "moveWidgetNext")} ${title}`} disabled={!canMoveNext} onClick={() => onMoveNext(id)} type="button">
            <ArrowRight size={14} />
          </button>
        </div>
        {(isMoveSource || isMoveTarget) && (
          <button
            aria-label={isMoveSource ? `${t(locale, "cancelMove")} ${title}` : `${t(locale, "placeWidgetHere")} ${title}`}
            className="dashboard-move-target"
            onClick={(event) => {
              event.preventDefault();
              onMoveTarget(id);
            }}
            type="button"
          >
            <span>{isMoveSource ? t(locale, "movingWidget") : t(locale, "placeHere")}</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

function InventoryInsightCard({
  locale,
  summary,
  setView,
}: {
  locale: Locale;
  summary: ReturnType<typeof summarizeInventory>;
  setView: (view: View) => void;
}) {
  const available = summary.byStatus.AVAILABLE;
  const toReview = summary.missingFront + summary.byStatus.REPAIR + summary.byStatus.LOST;

  return (
    <button className="insight-card" onClick={() => setView("inventory")} type="button">
      <div className="insight-icon"><Warehouse size={22} /></div>
      <span>{t(locale, "trackedItems")}</span>
      <strong>{summary.total}</strong>
      <p>{available} {t(locale, "availableItems")} · {toReview} {t(locale, "itemsToReview")}</p>
      <div className="mini-status-strip" aria-hidden="true">
        {statuses.map((status) => (
          <i
            key={status}
            style={{
              background: statusColors[status],
              flexGrow: Math.max(0.2, summary.byStatus[status]),
            }}
          />
        ))}
      </div>
    </button>
  );
}

function PhotoCoverageCard({
  locale,
  summary,
  setView,
}: {
  locale: Locale;
  summary: ReturnType<typeof summarizeInventory>;
  setView: (view: View) => void;
}) {
  const complete = Math.max(0, summary.total - summary.missingFront);
  const coverage = summary.total === 0 ? 0 : Math.round((complete / summary.total) * 100);

  return (
    <button className={`insight-card ${summary.missingFront > 0 ? "attention" : ""}`} onClick={() => setView("inventory")} type="button">
      <div className="insight-icon"><ImageIcon size={22} /></div>
      <span>{t(locale, "frontPhotoCoverage")}</span>
      <strong>{coverage}%</strong>
      <p>{complete}/{summary.total} {t(locale, "completeItems")} · {summary.missingFront} {t(locale, "missingPhotos")}</p>
      <div className="coverage-track" aria-hidden="true">
        <i style={{ width: `${coverage}%` }} />
      </div>
    </button>
  );
}

function LocationOverviewCard({
  locale,
  state,
  setView,
}: {
  locale: Locale;
  state: InventoryState;
  setView: (view: View) => void;
}) {
  const usage = state.locations
    .map((location) => ({
      ...location,
      count: state.items.filter((item) => item.locationId === location.id).length,
    }))
    .sort((a, b) => b.count - a.count || Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const visible = usage.slice(0, 5);
  const hiddenCount = Math.max(0, usage.length - visible.length);
  const max = Math.max(1, ...visible.map((location) => location.count));

  return (
    <button className="panel location-overview-panel span-2" onClick={() => setView("locations")} type="button">
      <div className="panel-title split-title">
        <div><MapPin size={18} /><h3>{t(locale, "locations")}</h3></div>
        <strong>{t(locale, "openLocations")}</strong>
      </div>
      <div className="location-usage-list">
        {visible.map((location) => (
          <div key={location.id} className="location-usage-row">
            <span className={`location-active-dot ${location.active ? "active" : ""}`}>
              {location.active ? <CheckCircle2 size={14} /> : <CircleOff size={14} />}
            </span>
            <div>
              <strong>{location.name}</strong>
              <span>{location.count} {t(locale, "itemCount")}</span>
            </div>
            <i><b style={{ width: `${(location.count / max) * 100}%` }} /></i>
          </div>
        ))}
      </div>
      {hiddenCount > 0 && <p>{hiddenCount} {t(locale, "otherLocations")}</p>}
    </button>
  );
}

function InventoryInsightCardV2({
  locale,
  summary,
  setView,
}: {
  locale: Locale;
  summary: ReturnType<typeof summarizeInventory>;
  setView: (view: View) => void;
}) {
  const available = summary.byStatus.AVAILABLE;
  const toReview = summary.missingFront + summary.byStatus.REPAIR + summary.byStatus.LOST;
  const visibleStatuses = statuses.filter((status) => summary.byStatus[status] > 0);

  return (
    <button className="insight-card" onClick={() => setView("inventory")} type="button">
      <div className="insight-icon"><Warehouse size={22} /></div>
      <span>{t(locale, "trackedItems")}</span>
      <strong>{summary.total}</strong>
      <p>{available} {t(locale, "availableItems")} - {toReview} {t(locale, "itemsToReview")}</p>
      <div className="insight-chip-list" aria-label={t(locale, "status")}>
        {visibleStatuses.map((status) => (
          <span key={status}>
            <i style={{ background: statusColors[status] }} />
            {statusLabels[locale][status]} {summary.byStatus[status]}
          </span>
        ))}
      </div>
    </button>
  );
}

function PhotoCoverageCardV2({
  locale,
  summary,
  setView,
}: {
  locale: Locale;
  summary: ReturnType<typeof summarizeInventory>;
  setView: (view: View) => void;
}) {
  const complete = Math.max(0, summary.total - summary.missingFront);
  const coverage = summary.total === 0 ? 0 : Math.round((complete / summary.total) * 100);

  return (
    <button className={`insight-card ${summary.missingFront > 0 ? "attention" : ""}`} onClick={() => setView("inventory")} type="button">
      <div className="insight-icon"><ImageIcon size={22} /></div>
      <span>{t(locale, "frontPhotoCoverage")}</span>
      <strong>{coverage}%</strong>
      <p>{complete}/{summary.total} {t(locale, "completeItems")} - {summary.missingFront} {t(locale, "missingPhotos")}</p>
      <div className="photo-split-track" aria-hidden="true">
        <i className="complete" style={{ width: `${coverage}%` }} />
        <i className="missing" style={{ width: `${100 - coverage}%` }} />
      </div>
      <div className="insight-chip-list">
        <span><i className="complete" />{t(locale, "withPhoto")} {complete}</span>
        <span><i className="missing" />{t(locale, "withoutPhoto")} {summary.missingFront}</span>
      </div>
    </button>
  );
}

function LocationOverviewCardV2({
  locale,
  state,
  setView,
}: {
  locale: Locale;
  state: InventoryState;
  setView: (view: View) => void;
}) {
  const [locationMode, setLocationMode] = useState<LocationChartMode>("bars");
  const usage = state.locations
    .map((location) => ({
      ...location,
      count: state.items.filter((item) => item.locationId === location.id).length,
    }))
    .sort((a, b) => b.count - a.count || Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const visible = usage.slice(0, 5);
  const hiddenCount = Math.max(0, usage.length - visible.length);
  const max = Math.max(1, ...visible.map((location) => location.count));
  const totalVisible = visible.reduce((acc, location) => acc + location.count, 0);
  const pieSegments = buildGenericPieSegments(visible.map((location, index) => ({
    value: location.count,
    color: locationColors[index % locationColors.length],
  })));

  return (
    <article className="panel location-overview-panel span-2">
      <div className="panel-title split-title">
        <div><MapPin size={18} /><h3>{t(locale, "locations")}</h3></div>
        <div className="segmented-control compact" aria-label={t(locale, "locationDisplay")}>
          <button className={locationMode === "bars" ? "active" : ""} onClick={() => setLocationMode("bars")} type="button">
            <LineChart size={14} />
            {t(locale, "chartLines")}
          </button>
          <button className={locationMode === "pie" ? "active" : ""} onClick={() => setLocationMode("pie")} type="button">
            <PieChart size={14} />
            {t(locale, "chartPie")}
          </button>
        </div>
      </div>
      {locationMode === "bars" ? (
        <div className="location-usage-list">
          {visible.map((location, index) => (
            <button
              key={location.id}
              aria-label={`${location.name} - ${location.active ? t(locale, "active") : t(locale, "inactive")}`}
              className="location-usage-row"
              onClick={() => setView("locations")}
              type="button"
            >
              <span className="location-label">
                <span className="location-name">{location.name}</span>
                <small className={`location-state ${location.active ? "active" : ""}`}>{location.active ? t(locale, "active") : t(locale, "inactive")}</small>
              </span>
              <div><i style={{ width: `${(location.count / max) * 100}%`, background: locationColors[index % locationColors.length] }} /></div>
              <strong>{location.count}</strong>
            </button>
          ))}
        </div>
      ) : (
        <div className="location-pie-layout">
          <button
            className="location-pie"
            onClick={() => setView("locations")}
            style={{ background: pieSegments.length ? `conic-gradient(${pieSegments.join(", ")})` : "var(--media-bg)" }}
            type="button"
            aria-label={t(locale, "locations")}
          >
            <span>{totalVisible}</span>
            <small>{t(locale, "itemCount")}</small>
          </button>
          <div className="location-pie-legend">
            {visible.map((location, index) => (
              <button key={location.id} onClick={() => setView("locations")} type="button">
                <i style={{ background: locationColors[index % locationColors.length] }} />
                <span>{location.name}</span>
                <strong>{location.count}</strong>
              </button>
            ))}
          </div>
        </div>
      )}
      {hiddenCount > 0 && <p>{hiddenCount} {t(locale, "otherLocations")}</p>}
    </article>
  );
}

function ActionActivityChart({ actions, locale, advanced = false }: { actions: InventoryAction[]; locale: Locale; advanced?: boolean }) {
  const [range, setRange] = useState<ActionRange>("7d");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const actionTypes = useMemo(() => getActionTypes(actions), [actions]);
  const [selectedTypes, setSelectedTypes] = useState<string[] | null>(null);
  const enabledTypes = selectedTypes ?? actionTypes;
  const chart = buildActionChartData(actions, range, enabledTypes, nowTick);
  const periodCounts = getPeriodActionCounts(actions, range, nowTick);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 3000);
    return () => window.clearInterval(timer);
  }, []);

  function toggleType(type: string) {
    const current = selectedTypes ?? actionTypes;
    const next = current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type];
    setSelectedTypes(next);
  }

  return (
    <div className={`action-chart ${advanced ? "advanced" : ""}`}>
      <div className="action-chart-toolbar">
        <div className="segmented-control compact" aria-label={t(locale, "actionRange")}>
          {(["24h", "7d", "30d"] as ActionRange[]).map((entry) => (
            <button className={range === entry ? "active" : ""} key={entry} onClick={() => setRange(entry)} type="button">
              {t(locale, entry === "24h" ? "range24h" : entry === "7d" ? "range7d" : "range30d")}
            </button>
          ))}
        </div>
        {advanced && <strong>{actions.length} {t(locale, "recentActions").toLowerCase()}</strong>}
      </div>

      {actionTypes.length === 0 ? (
        <div className="empty-state small">{t(locale, "noHistory")}</div>
      ) : (
        <>
          <div className="action-chart-canvas">
            <svg viewBox="0 0 100 64" preserveAspectRatio="none" role="img" aria-label={t(locale, "actionActivity")}>
              <g className="chart-grid">
                <line x1="0" x2="100" y1="10" y2="10" />
                <line x1="0" x2="100" y1="32" y2="32" />
                <line x1="0" x2="100" y1="54" y2="54" />
              </g>
              {chart.series.map((series) => (
                <path
                  d={series.path}
                  fill="none"
                  key={series.type}
                  pathLength={1}
                  stroke={getActionColor(series.type, actionTypes)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.35}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {chart.max === 0 && <span>{t(locale, "noActionInRange")}</span>}
          </div>
          <div className="action-chart-labels" aria-hidden="true">
            <span>{chart.labels[0]}</span>
            <span>{chart.labels[Math.floor(chart.labels.length / 2)]}</span>
            <span>{chart.labels[chart.labels.length - 1]}</span>
          </div>
          <div className="action-type-toggles">
            {actionTypes.map((type) => {
              const active = enabledTypes.includes(type);
              return (
                <button className={active ? "active" : ""} key={type} onClick={() => toggleType(type)} type="button">
                  <i style={{ background: getActionColor(type, actionTypes) }} />
                  <span>{actionLabel(locale, type)}</span>
                  {advanced && <strong>{periodCounts[type] ?? 0}</strong>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function getActionTypes(actions: InventoryAction[]) {
  const counts = actions.reduce((acc, action) => ({ ...acc, [action.type]: (acc[action.type] ?? 0) + 1 }), {} as Record<string, number>);
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
}

function getActionColor(type: string, allTypes: string[]) {
  const index = Math.max(0, allTypes.indexOf(type));
  return actionColors[index % actionColors.length];
}

function getPeriodActionCounts(actions: InventoryAction[], range: ActionRange, now = Date.now()) {
  const { buckets, stepMs } = actionRanges[range];
  const start = now - stepMs * (buckets - 1);
  return actions.reduce((acc, action) => {
    const time = new Date(action.at).getTime();
    if (time < start) return acc;
    return { ...acc, [action.type]: (acc[action.type] ?? 0) + 1 };
  }, {} as Record<string, number>);
}

function buildActionChartData(actions: InventoryAction[], range: ActionRange, types: string[], now = Date.now()) {
  const { buckets, stepMs } = actionRanges[range];
  const start = now - stepMs * (buckets - 1);
  const labels = Array.from({ length: buckets }, (_, index) => formatBucketLabel(new Date(start + index * stepMs), range));
  const valuesByType = Object.fromEntries(types.map((type) => [type, Array.from({ length: buckets }, () => 0)])) as Record<string, number[]>;

  actions.forEach((action) => {
    if (!types.includes(action.type)) return;
    const time = new Date(action.at).getTime();
    if (time < start || time > now) return;
    const index = Math.min(buckets - 1, Math.max(0, Math.floor((time - start) / stepMs)));
    valuesByType[action.type][index] += 1;
  });

  const max = Math.max(0, ...Object.values(valuesByType).flat());
  const series = types.map((type) => ({
    type,
    path: buildSmoothPath(valuesByType[type]
      .map((value, index) => {
        const x = buckets === 1 ? 50 : (index / (buckets - 1)) * 100;
        const y = max === 0 ? 54 : 54 - (value / max) * 44;
        return { x, y };
      })),
  }));

  return { labels, max, series };
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX.toFixed(2)} ${previous.y.toFixed(2)}, ${controlX.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, "");
}

function formatBucketLabel(date: Date, range: ActionRange) {
  if (range === "24h") {
    return date.toLocaleTimeString([], { hour: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
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

function buildGenericPieSegments(entries: Array<{ value: number; color: string }>) {
  const total = entries.reduce((acc, entry) => acc + entry.value, 0);
  if (total <= 0) return [];
  let cursor = 0;
  return entries.flatMap((entry) => {
    if (entry.value <= 0) return [];
    const start = cursor;
    const end = cursor + (entry.value / total) * 360;
    cursor = end;
    return `${entry.color} ${start}deg ${end}deg`;
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
