export const statuses = [
  "AVAILABLE",
  "RENTED",
  "REPAIR",
  "SOLD",
  "LOST",
  "DUPLICATE",
] as const;

export type ItemStatus = (typeof statuses)[number];
export type Role = "owner" | "admin" | "manager" | "operator";
export type Locale = "fr" | "en" | "es";

export type Location = {
  id: string;
  name: string;
  notes: string;
  active: boolean;
};

export type Photo = {
  id: string;
  itemId: string;
  url: string;
  originalName: string;
  active: boolean;
  createdAt: string;
};

export type Item = {
  id: string;
  tag: string;
  name: string;
  category: string;
  status: ItemStatus;
  locationId: string;
  notes: string;
  frontPhotoId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryAction = {
  id: string;
  itemId: string;
  type: string;
  actor: string;
  at: string;
};

export type Organization = {
  id: string;
  name: string;
  plan: "demo" | "pro";
};

export type InventoryState = {
  organization: Organization;
  locations: Location[];
  items: Item[];
  photos: Photo[];
  actions: InventoryAction[];
};

export type InventorySummary = {
  total: number;
  missingFront: number;
  byStatus: Record<ItemStatus, number>;
  byLocation: Array<{ locationId: string; name: string; count: number }>;
};
