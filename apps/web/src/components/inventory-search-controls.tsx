"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categories } from "@/lib/inventory";
import { statusLabels, t } from "@/lib/i18n";
import { statuses, type InventorySort, type InventoryState, type ItemStatus, type Locale } from "@/lib/types";
import { useSearchShortcut } from "./use-search-shortcut";

export function InventorySearchControls({
  locale,
  state,
  query,
  setQuery,
  locationFilter,
  setLocationFilter,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  resultCount,
}: {
  locale: Locale;
  state: InventoryState;
  query: string;
  setQuery: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  statusFilter: ItemStatus | "all";
  setStatusFilter: (value: ItemStatus | "all") => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  sortBy: InventorySort;
  setSortBy: (value: InventorySort) => void;
  resultCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sticky, setSticky] = useState(false);
  useSearchShortcut(inputRef, () => setQuery(""));

  useEffect(() => {
    function onScroll() {
      setSticky(window.scrollY > 250);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const controls = (
    <>
      <label className="cards-search-field">
        <Search size={19} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(locale, "globalSearchPlaceholder")}
          data-testid="inventory-card-search"
        />
      </label>
      <div className="cards-filter-grid">
        <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label={t(locale, "locations")}>
          <option value="all">{t(locale, "allLocations")}</option>
          {state.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ItemStatus | "all")} aria-label={t(locale, "status")}>
          <option value="all">{t(locale, "status")}</option>
          {statuses.map((status) => <option key={status} value={status}>{statusLabels[locale][status]}</option>)}
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label={t(locale, "category")}>
          <option value="all">{t(locale, "allCategories")}</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as InventorySort)} aria-label={t(locale, "sort")}>
          <option value="recent">{t(locale, "sortRecent")}</option>
          <option value="tag">{t(locale, "sortTag")}</option>
          <option value="name">{t(locale, "sortName")}</option>
          <option value="status">{t(locale, "sortStatus")}</option>
          <option value="location">{t(locale, "sortLocation")}</option>
        </select>
      </div>
    </>
  );

  return (
    <>
      <section className="cards-controls panel">
        <div className="cards-controls-header">
          <div>
            <p className="eyebrow"><SlidersHorizontal size={14} /> {t(locale, "smartInventory")}</p>
            <h3>{t(locale, "globalSearch")}</h3>
          </div>
          <strong>{resultCount} {t(locale, "results")}</strong>
        </div>
        {controls}
        <p className="shortcut-hint">Ctrl/Cmd+F focus · Escape clear</p>
      </section>

      <section className={`cards-controls sticky-cards-controls ${sticky ? "visible" : ""}`}>
        {controls}
      </section>
    </>
  );
}
