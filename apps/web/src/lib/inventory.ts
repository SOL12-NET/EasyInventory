import { demoState } from "./seed";
import { statuses, type InventorySort, type InventoryState, type InventorySummary, type Item, type ItemStatus, type Location, type Role } from "./types";

export const categories = ["Appliance", "Furniture", "Tool", "Accessory", "Other"] as const;

export function cloneDemoState(): InventoryState {
  return structuredClone(demoState);
}

function actionEntry(itemId: string, type: string, actor: Role, at = new Date().toISOString()) {
  return { id: crypto.randomUUID(), itemId, type, actor, at };
}

function patchItemLastAction(item: Item, type: string, actor: Role, at: string): Item {
  return { ...item, lastAction: type, lastActionBy: actor, lastActionAt: at, updatedAt: at };
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
  const action = state.actions
    .filter((action) => action.itemId === itemId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0] ?? null;
  if (action) return action;
  const item = state.items.find((entry) => entry.id === itemId);
  return item?.lastAction && item.lastActionAt
    ? { id: `${item.id}-last`, itemId: item.id, type: item.lastAction, actor: item.lastActionBy ?? "operator", at: item.lastActionAt }
    : null;
}

export function getItemActions(state: InventoryState, itemId: string) {
  return state.actions
    .filter((action) => action.itemId === itemId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function getItemPhotos(state: InventoryState, item: Item | null) {
  if (!item) return [];
  return state.photos
    .filter((photo) => photo.itemId === item.id && photo.active)
    .sort((a, b) => {
      if (a.id === item.frontPhotoId) return -1;
      if (b.id === item.frontPhotoId) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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

  const sorted = sortInventoryItems(state, filtered, sortBy);
  if (needle) {
    sorted.sort((a, b) => {
      const aTag = normalizeSearchText(a.tag);
      const bTag = normalizeSearchText(b.tag);
      const aScore = aTag === needle ? 0 : aTag.startsWith(needle) ? 1 : 2;
      const bScore = bTag === needle ? 0 : bTag.startsWith(needle) ? 1 : 2;
      return aScore - bScore;
    });
  }

  return sorted;
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

export function createItem(state: InventoryState, locationId: string, actor: Role = "operator"): InventoryState {
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
    lastAction: "NEW_ITEM",
    lastActionBy: actor,
    lastActionAt: at,
    createdAt: at,
    updatedAt: at,
  };

  return {
    ...state,
    items: [item, ...state.items],
    actions: [
      actionEntry(item.id, "NEW_ITEM", actor, at),
      ...state.actions,
    ],
  };
}

export function updateItem(state: InventoryState, itemId: string, patch: Partial<Item>, actionType = "EDIT_ITEM", actor: Role = "operator") {
  const at = new Date().toISOString();
  return {
    ...state,
    items: state.items.map((item) => (item.id === itemId ? patchItemLastAction({ ...item, ...patch }, actionType, actor, at) : item)),
    actions: [actionEntry(itemId, actionType, actor, at), ...state.actions],
  };
}

export function addLocation(state: InventoryState, name: string, notes = "") {
  const clean = name.trim();
  if (!clean) return state;
  const at = new Date().toISOString();
  return {
    ...state,
    locations: [
      ...state.locations,
      { id: crypto.randomUUID(), name: clean, notes: notes.trim(), active: true, createdAt: at, updatedAt: at },
    ],
  };
}

export function updateLocation(state: InventoryState, locationId: string, patch: Partial<Location>) {
  const at = new Date().toISOString();
  return {
    ...state,
    locations: state.locations.map((location) => (
      location.id === locationId ? { ...location, ...patch, updatedAt: at } : location
    )),
  };
}

export function addPhotosToItem(
  state: InventoryState,
  itemId: string,
  files: Array<{ url: string; originalName: string }>,
  actor: Role = "operator",
) {
  if (!files.length) return state;
  const at = new Date().toISOString();
  const photos = files.map((file) => ({
    id: crypto.randomUUID(),
    itemId,
    url: file.url,
    originalName: file.originalName,
    active: true,
    createdAt: at,
  }));
  const currentItem = state.items.find((item) => item.id === itemId);
  const frontPhotoId = currentItem?.frontPhotoId ?? photos[0]?.id ?? null;
  return {
    ...state,
    photos: [...photos, ...state.photos],
    items: state.items.map((item) => (
      item.id === itemId ? patchItemLastAction({ ...item, frontPhotoId }, "NEW_UPLOAD", actor, at) : item
    )),
    actions: [actionEntry(itemId, "NEW_UPLOAD", actor, at), ...state.actions],
  };
}

export function setFrontPhoto(state: InventoryState, itemId: string, photoId: string, actor: Role = "operator") {
  const photo = state.photos.find((entry) => entry.id === photoId && entry.itemId === itemId && entry.active);
  if (!photo) return state;
  return updateItem(state, itemId, { frontPhotoId: photoId }, "PHOTO_FRONT", actor);
}

export function deactivatePhoto(state: InventoryState, itemId: string, photoId: string, actor: Role = "operator") {
  const at = new Date().toISOString();
  const nextPhotos = state.photos.map((photo) => (
    photo.id === photoId && photo.itemId === itemId ? { ...photo, active: false } : photo
  ));
  const remaining = nextPhotos
    .filter((photo) => photo.itemId === itemId && photo.active && photo.id !== photoId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return {
    ...state,
    photos: nextPhotos,
    items: state.items.map((item) => {
      if (item.id !== itemId) return item;
      const frontPhotoId = item.frontPhotoId === photoId ? remaining[0]?.id ?? null : item.frontPhotoId;
      return patchItemLastAction({ ...item, frontPhotoId }, "PHOTO_UNLINK", actor, at);
    }),
    actions: [actionEntry(itemId, "PHOTO_UNLINK", actor, at), ...state.actions],
  };
}

export function getFrontPhoto(state: InventoryState, item: Item | null) {
  if (!item?.frontPhotoId) return null;
  return state.photos.find((photo) => photo.id === item.frontPhotoId && photo.active) ?? null;
}
