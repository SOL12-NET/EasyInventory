"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleOff,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Image as ImageIcon,
  LineChart,
  MapPin,
  PieChart,
  RotateCcw,
  SlidersHorizontal,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { actionLabel, statusLabels, t } from "@/lib/i18n";
import { statuses, type InventoryAction, type InventoryState, type ItemStatus, type Locale, type Location, type Item } from "@/lib/types";
import { summarizeInventory } from "@/lib/inventory";

export type View = "dashboard" | "inventory" | "logs" | "documentation" | "locations" | "accounts";
type StatusChartMode = "lines" | "pie";
type LocationChartMode = "bars" | "pie";
type ActionRange = "24h" | "7d" | "30d";
type TranslationKey = Parameters<typeof t>[1];

export type DashboardWidgetId = "scope" | "inventory" | "photos" | "status" | "locations" | "actions";
export type DashboardLayoutState = {
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
  lastPlacement?: DashboardDropPlacement;
};
type DashboardDropPlacement = "before" | "after";
type DashboardDropTarget = {
  id: DashboardWidgetId;
  placement: DashboardDropPlacement;
};

const dashboardWidgetIds: DashboardWidgetId[] = ["scope", "inventory", "photos", "status", "locations", "actions"];
export const defaultDashboardLayout: DashboardLayoutState = { order: dashboardWidgetIds, hidden: [] };
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

export const statusColors: Record<ItemStatus, string> = {
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

export const dashboardLayoutStorageKey = "easyinventory.saas.dashboard-layout";

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

export function DashboardView({
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

      const dropPoint = getDragDropPoint(next);
      const target = getDashboardDropTarget(dropPoint.x, dropPoint.y, current.id);
      if (!target) {
        const idle = { ...next, lastTarget: undefined, lastPlacement: undefined };
        pointerDragRef.current = idle;
        setPointerDrag(idle);
        setDragOverWidget(null);
        return;
      }

      const now = window.performance.now();
      if ((target.id !== current.lastTarget || target.placement !== current.lastPlacement) && now - current.lastMoveAt > 110) {
        const moved = { ...next, lastMoveAt: now, lastTarget: target.id, lastPlacement: target.placement };
        pointerDragRef.current = moved;
        setPointerDrag(moved);
        setDragOverWidget(target.id);
        moveDashboardWidget(current.id, target.id, { clearMove: false, placement: target.placement, skipAnimationFor: current.id });
      }
    }

    function handlePointerEnd(event: globalThis.PointerEvent) {
      const current = pointerDragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      if (current.active) {
        const dropPoint = getDragDropPoint({ ...current, x: event.clientX, y: event.clientY });
        const target = getDashboardDropTarget(dropPoint.x, dropPoint.y, current.id);
        if (target) moveDashboardWidget(current.id, target.id, { clearMove: false, placement: target.placement, skipAnimationFor: current.id });
      }
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

  function getVisualWidgetOrder() {
    return visibleWidgets
      .map((id) => {
        const node = widgetRefs.current.get(id);
        return node ? { id, rect: node.getBoundingClientRect() } : null;
      })
      .filter((entry): entry is { id: DashboardWidgetId; rect: DOMRect } => Boolean(entry))
      .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)
      .map((entry) => entry.id);
  }

  function animateWidgetLayout(firstRects: Map<DashboardWidgetId, DOMRect>, skipId?: DashboardWidgetId) {
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
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 280, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    });
  }

  function getMovedWidgetOrder(order: DashboardWidgetId[], source: DashboardWidgetId, target: DashboardWidgetId, placement: DashboardDropPlacement = "before") {
    const nextOrder = order.filter((id) => id !== source);
    const targetIndex = nextOrder.indexOf(target);
    const insertIndex = targetIndex < 0 ? nextOrder.length : targetIndex + (placement === "after" ? 1 : 0);
    nextOrder.splice(insertIndex, 0, source);
    return nextOrder;
  }

  function getFloatingWidgetStyle(drag: DashboardPointerDrag | null, id: DashboardWidgetId): CSSProperties | undefined {
    if (!drag || drag.id !== id || !drag.active) return undefined;
    return {
      height: drag.height,
      left: drag.x - drag.offsetX,
      position: "fixed",
      top: drag.y - drag.offsetY,
      transformOrigin: `${drag.offsetX}px ${drag.offsetY}px`,
      transition: "none",
      width: drag.width,
      zIndex: 50,
    };
  }

  function getDragDropPoint(drag: DashboardPointerDrag) {
    return {
      x: drag.x - drag.offsetX + drag.width / 2,
      y: drag.y - drag.offsetY + drag.height / 2,
    };
  }

  function moveDashboardWidget(source: DashboardWidgetId, target: DashboardWidgetId, options: { clearMove?: boolean; placement?: DashboardDropPlacement; skipAnimationFor?: DashboardWidgetId } = {}) {
    if (source === target) return;
    const firstRects = getWidgetRects();
    const visualOrder = getVisualWidgetOrder();
    let moved = false;
    flushSync(() => {
      setDashboardLayout((current) => {
        const hiddenOrder = current.order.filter((id) => current.hidden.includes(id));
        const orderedVisible = [
          ...visualOrder.filter((id) => current.order.includes(id)),
          ...current.order.filter((id) => !current.hidden.includes(id) && !visualOrder.includes(id)),
        ];
        const order = [...getMovedWidgetOrder(orderedVisible, source, target, options.placement), ...hiddenOrder];
        if (order.join("|") === current.order.join("|")) return current;
        moved = true;
        return { ...current, order };
      });
    });
    if (moved) animateWidgetLayout(firstRects, options.skipAnimationFor);
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
    let moved = false;
    flushSync(() => {
      setDashboardLayout((current) => {
        const visible = current.order.filter((widgetId) => !current.hidden.includes(widgetId));
        const index = visible.indexOf(id);
        const target = visible[index + direction];
        if (!target) return current;
        const order = current.order.filter((widgetId) => widgetId !== id);
        const targetIndex = order.indexOf(target);
        order.splice(direction < 0 ? targetIndex : targetIndex + 1, 0, id);
        moved = true;
        return { ...current, order };
      });
    });
    if (moved) animateWidgetLayout(firstRects);
  }

  function getDashboardDropTarget(x: number, y: number, ignoreId: DashboardWidgetId): DashboardDropTarget | null {
    const entries = visibleWidgets
      .filter((id) => id !== ignoreId)
      .map((id) => {
        const node = widgetRefs.current.get(id);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return { id, rect };
      })
      .filter((entry): entry is { id: DashboardWidgetId; rect: DOMRect } => Boolean(entry));

    if (entries.length === 0) return null;

    const rows: Array<{ top: number; bottom: number; items: typeof entries }> = [];
    for (const entry of [...entries].sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)) {
      const row = rows.find((candidate) => Math.abs(candidate.top - entry.rect.top) < 36);
      if (row) {
        row.top = Math.min(row.top, entry.rect.top);
        row.bottom = Math.max(row.bottom, entry.rect.bottom);
        row.items.push(entry);
      } else {
        rows.push({ top: entry.rect.top, bottom: entry.rect.bottom, items: [entry] });
      }
    }

    const closestRow = rows.reduce((best, row) => {
      const distance = y < row.top ? row.top - y : y > row.bottom ? y - row.bottom : 0;
      return distance < best.distance ? { row, distance } : best;
    }, { row: rows[0], distance: Number.POSITIVE_INFINITY }).row;

    const rowItems = closestRow.items.sort((a, b) => a.rect.left - b.rect.left);
    for (const entry of rowItems) {
      const centerX = entry.rect.left + entry.rect.width / 2;
      if (x < centerX) return { id: entry.id, placement: "before" };
    }
    return { id: rowItems[rowItems.length - 1].id, placement: "after" };
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
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
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
          isDragging={(draggedWidget === id && pointerDrag?.id !== id) || (pointerDrag?.id === id && pointerDrag.active)}
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
  const widgetSurface = (
    <div className={`dashboard-widget-surface ${isPointerDragging ? "is-floating" : ""}`} style={dragStyle}>
      <button
        aria-label={`${t(locale, "moveWidget")} ${title}`}
        className="dashboard-drag-handle"
        draggable={false}
        title={t(locale, "moveWidget")}
        onDragStart={(event) => {
          event.preventDefault();
          onDragStart(id, event);
        }}
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
  );

  return (
    <>
      <div
        className={`dashboard-widget-frame ${span === 2 ? "span-2" : ""} ${isDragging ? "is-dragging" : ""} ${isPointerDragging ? "is-pointer-dragging" : ""} ${isDragOver ? "is-drag-over" : ""} ${isMoveSource ? "is-move-source" : ""} ${isMoveTarget ? "is-move-target" : ""}`}
        data-dashboard-widget-id={id}
        onDragOver={(event) => onDragOver(id, event)}
        onDrop={(event) => onDrop(id, event)}
        ref={(node) => registerWidget(id, node)}
        style={placeholderStyle}
      >
        {!isPointerDragging && widgetSurface}
      </div>
      {isPointerDragging && dragStyle && typeof document !== "undefined" ? createPortal(widgetSurface, document.body) : null}
    </>
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

export function ActionActivityChart({ actions, locale, advanced = false }: { actions: InventoryAction[]; locale: Locale; advanced?: boolean }) {
  const [range, setRange] = useState<ActionRange>("7d");
  const actionTypes = useMemo(() => getActionTypes(actions), [actions]);
  const [enabledTypes, setEnabledTypes] = useState<string[]>([]);

  useEffect(() => {
    setEnabledTypes(actionTypes.slice(0, 4));
  }, [actionTypes]);

  const periodCounts = useMemo(() => getPeriodActionCounts(actions, range), [actions, range]);
  const chart = useMemo(() => buildActionChartData(actions, range, enabledTypes), [actions, range, enabledTypes]);

  function toggleType(type: string) {
    setEnabledTypes((current) =>
      current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type]
    );
  }

  const hasData = Object.values(periodCounts).some((count) => count > 0);

  return (
    <div className={`action-chart ${advanced ? "advanced" : ""}`}>
      {advanced && (
        <div className="action-chart-toolbar">
          <span>{t(locale, "actionActivity")}</span>
          <div className="segmented-control compact" aria-label={t(locale, "actionRange")}>
            {(["24h", "7d", "30d"] as ActionRange[]).map((entry) => (
              <button className={range === entry ? "active" : ""} key={entry} onClick={() => setRange(entry)} type="button">
                {t(locale, `range${entry}` as any)}
              </button>
            ))}
          </div>
        </div>
      )}
      {!hasData ? (
        <div className="action-chart-canvas">
          <span>{t(locale, "noActionInRange")}</span>
        </div>
      ) : (
        <>
          <div className="action-chart-canvas" aria-hidden="true">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                {chart.series.map((item) => (
                  <linearGradient id={`gradient-${item.type}`} x1="0" y1="0" x2="0" y2="1" key={item.type}>
                    <stop offset="0%" stopColor={getActionColor(item.type, actionTypes)} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={getActionColor(item.type, actionTypes)} stopOpacity="0.0" />
                  </linearGradient>
                ))}
              </defs>
              <g className="chart-grid">
                <line x1="0" y1="10" x2="100" y2="10" />
                <line x1="0" y1="32" x2="100" y2="32" />
                <line x1="0" y1="54" x2="100" y2="54" />
              </g>
              {chart.series.map((item) => {
                const fillPath = item.path ? `${item.path} L 100 54 L 0 54 Z` : "";
                return (
                  <g key={item.type}>
                    {fillPath && (
                      <path d={fillPath} fill={`url(#gradient-${item.type})`} stroke="none" />
                    )}
                    <path
                      d={item.path}
                      stroke={getActionColor(item.type, actionTypes)}
                      strokeWidth="2"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </svg>
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
