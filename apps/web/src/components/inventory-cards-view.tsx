"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { t } from "@/lib/i18n";
import type { InventoryState, Item, Locale, Role } from "@/lib/types";
import { InventoryCard } from "./inventory-card";
import { InventoryDetailPanel } from "./inventory-detail-panel";
import { InventorySearchControls } from "./inventory-search-controls";
import { useInventorySearch } from "./use-inventory-search";

export function InventoryCardsView({
  locale,
  state,
  role,
  selectedId,
  setSelectedId,
  resetSignal,
  setItemPatch,
  handlePhoto,
  setFrontPhoto,
  deactivatePhoto,
}: {
  locale: Locale;
  state: InventoryState;
  role: Role;
  selectedId: string;
  setSelectedId: (id: string) => void;
  resetSignal: number;
  setItemPatch: (patch: Partial<Item>, action?: string) => void;
  handlePhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  setFrontPhoto: (itemId: string, photoId: string) => void;
  deactivatePhoto: (itemId: string, photoId: string) => void;
}) {
  const search = useInventorySearch(state);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const selectedItem = search.visibleItems.find((item) => item.id === selectedId) ?? search.visibleItems[0] ?? state.items[0] ?? null;

  useEffect(() => {
    if (selectedItem && !state.items.some((item) => item.id === selectedId)) {
      setSelectedId(selectedItem.id);
    }
  }, [selectedId, selectedItem, setSelectedId, state.items]);

  useEffect(() => {
    search.setQuery("");
    search.setLocationFilter("all");
    search.setStatusFilter("all");
    search.setCategoryFilter("all");
    search.setSortBy("recent");
    setMobileDetailOpen(false);
  }, [resetSignal]);

  function selectCard(item: Item) {
    setSelectedId(item.id);
    setMobileDetailOpen(true);
  }

  return (
    <section className="inventory-cards-view">
      <InventorySearchControls
        locale={locale}
        state={state}
        query={search.query}
        setQuery={search.setQuery}
        locationFilter={search.locationFilter}
        setLocationFilter={search.setLocationFilter}
        statusFilter={search.statusFilter}
        setStatusFilter={search.setStatusFilter}
        categoryFilter={search.categoryFilter}
        setCategoryFilter={search.setCategoryFilter}
        sortBy={search.sortBy}
        setSortBy={search.setSortBy}
        resultCount={search.visibleItems.length}
      />

      <div className="inventory-cards-layout">
        <section className="inventory-card-grid" aria-label={t(locale, "inventory")}>
          {search.visibleItems.length === 0 && (
            <div className="empty-state cards-empty">
              {t(locale, "empty")} "{search.query}"
            </div>
          )}
          {search.visibleItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              state={state}
              locale={locale}
              selected={selectedItem?.id === item.id}
              query={search.query}
              onSelect={() => selectCard(item)}
            />
          ))}
        </section>

        <InventoryDetailPanel
          locale={locale}
          state={state}
          role={role}
          selectedItem={selectedItem}
          mobileOpen={mobileDetailOpen}
          closeMobile={() => setMobileDetailOpen(false)}
          setItemPatch={setItemPatch}
          handlePhoto={handlePhoto}
          setFrontPhoto={setFrontPhoto}
          deactivatePhoto={deactivatePhoto}
        />
      </div>
    </section>
  );
}
