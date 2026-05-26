import { demoState } from "./seed";
import { statuses, type InventoryState, type InventorySummary, type Item, type ItemStatus } from "./types";

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

export function searchItems(state: InventoryState, query: string, locationId = "all", status: ItemStatus | "all" = "all") {
  const needle = query.trim().toLowerCase();
  return state.items.filter((item) => {
    const matchesLocation = locationId === "all" || item.locationId === locationId;
    const matchesStatus = status === "all" || item.status === status;
    const haystack = `${item.tag} ${item.name} ${item.category} ${item.notes}`.toLowerCase();
    const matchesQuery = !needle || haystack.includes(needle);
    return matchesLocation && matchesStatus && matchesQuery;
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
