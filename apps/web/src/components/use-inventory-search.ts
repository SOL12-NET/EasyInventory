"use client";

import { useMemo, useState } from "react";
import { searchItems } from "@/lib/inventory";
import type { InventorySort, InventoryState, ItemStatus } from "@/lib/types";

export function useInventorySearch(state: InventoryState) {
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<InventorySort>("recent");

  const visibleItems = useMemo(
    () => searchItems(state, query, locationFilter, statusFilter, categoryFilter, sortBy),
    [state, query, locationFilter, statusFilter, categoryFilter, sortBy],
  );

  return {
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
    visibleItems,
  };
}
