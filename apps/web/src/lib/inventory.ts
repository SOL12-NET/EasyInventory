import { demoState } from "./seed";
import { statuses, type InventorySort, type InventoryState, type InventorySummary, type Item, type ItemStatus } from "./types";

export const categories = ["Appliance", "Furniture", "Tool", "Accessory", "Other"] as const;

export function cloneDemoState(): InventoryState {
  return structuredClone(demoState);
}

export function summarizeInventory(state: InventoryState, locationId = "all"): InventorySummary {
  const items = locationId === "all" ? state.items : state.items.filter((item) => item.locationId === locationId);
  const byStatus = statuses.reduce(
    (acc, status) => ({ ...acc, [status]: items.filter((item) => item.status === status).length }),
    {} as Record<ItemStatus, number>,
  );

  return {
    total: items.length,
    missingFront: items.filter((item) => !item.frontPhotoId).length,
    byStatus,
    byLocation: state.locations
      .filter((location) => location.active)
      .map((location) => ({
        locationId: location.id,
        name: location.name,
        count: state.items.filter((item) => item.locationId === location.id).length,
      })),
  };
}

export function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function getLastAction(state: InventoryState, itemId: string) {
  return state.actions
    .filter((action) => action.itemId === itemId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0] ?? null;
}

export function buildSearchIndex(state: InventoryState, item: Item) {
  const location = state.locations.find((entry) => entry.id === item.locationId);
  const lastAction = getLastAction(state, item.id);
  return normalizeSearchText([
    item.tag,
    item.name,
    item.category,
    item.status,
    location?.name,
    location?.notes,
    item.notes,
    lastAction?.type,
    lastAction?.actor,
  ].join(" "));
}

export function searchItems(
  state: InventoryState,
  query: string,
  locationId = "all",
  status: ItemStatus | "all" = "all",
  category = "all",
  sortBy: InventorySort = "recent",
) {
  const needle = normalizeSearchText(query);
  const filtered = state.items.filter((item) => {
    const matchesLocation = locationId === "all" || item.locationId === locationId;
    const matchesStatus = status === "all" || item.status === status;
    const matchesCategory = category === "all" || item.category === category;
    const matchesQuery = !needle || buildSearchIndex(state, item).includes(needle);
    return matchesLocation && matchesStatus && matchesCategory && matchesQuery;
  });

  return sortInventoryItems(state, filtered, sortBy);
}

export function sortInventoryItems(state: InventoryState, items: Item[], sortBy: InventorySort) {
  return [...items].sort((a, b) => {
    if (sortBy === "tag") {
      return (Number.parseInt(a.tag, 10) || 0) - (Number.parseInt(b.tag, 10) || 0);
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    if (sortBy === "location") {
      const locA = state.locations.find((location) => location.id === a.locationId)?.name ?? "";
      const locB = state.locations.find((location) => location.id === b.locationId)?.name ?? "";
      return locA.localeCompare(locB, undefined, { sensitivity: "base" }) || a.tag.localeCompare(b.tag);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function nextTag(items: Item[]) {
  const max = items.reduce((acc, item) => Math.max(acc, Number.parseInt(item.tag, 10) || 0), 1000);
  return String(max + 1);
}

export function createItem(state: InventoryState, locationId: string): InventoryState {
  const at = new Date().toISOString();
  const item: Item = {
    id: crypto.randomUUID(),
    tag: nextTag(state.items),
    name: "Nouvel article",
    category: "Other",
    status: "AVAILABLE",
    locationId,
    notes: "",
    frontPhotoId: null,
    createdAt: at,
    updatedAt: at,
  };

  return {
    ...state,
    items: [item, ...state.items],
    actions: [
      { id: crypto.randomUUID(), itemId: item.id, type: "NEW_ITEM", actor: "operator", at },
      ...state.actions,
    ],
  };
}

export function updateItem(state: InventoryState, itemId: string, patch: Partial<Item>, actionType = "EDIT_ITEM") {
  const at = new Date().toISOString();
  return {
    ...state,
    items: state.items.map((item) => (item.id === itemId ? { ...item, ...patch, updatedAt: at } : item)),
    actions: [{ id: crypto.randomUUID(), itemId, type: actionType, actor: "operator", at }, ...state.actions],
  };
}

export function addLocation(state: InventoryState, name: string) {
  const clean = name.trim();
  if (!clean) return state;
  return {
    ...state,
    locations: [
      ...state.locations,
      { id: crypto.randomUUID(), name: clean, notes: "", active: true },
    ],
  };
}

export function getFrontPhoto(state: InventoryState, item: Item | null) {
  if (!item?.frontPhotoId) return null;
  return state.photos.find((photo) => photo.id === item.frontPhotoId && photo.active) ?? null;
}
