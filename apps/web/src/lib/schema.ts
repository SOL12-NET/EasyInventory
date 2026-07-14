import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const itemStatus = pgEnum("item_status", [
  "AVAILABLE",
  "RENTED",
  "REPAIR",
  "SOLD",
  "LOST",
  "DUPLICATE",
]);

export const role = pgEnum("member_role", ["owner", "admin", "manager", "operator"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("pro"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    name: text("name").notNull(),
    notes: text("notes").notNull().default(""),
    active: boolean("active").notNull().default(true),
    legacyBaserowId: text("legacy_baserow_id"),
  },
  (table) => [index("locations_org_idx").on(table.organizationId)],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    tag: text("tag").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull().default("Other"),
    status: itemStatus("status").notNull().default("AVAILABLE"),
    locationId: uuid("location_id").notNull().references(() => locations.id),
    notes: text("notes").notNull().default(""),
    frontPhotoId: uuid("front_photo_id"),
    legacyBaserowId: text("legacy_baserow_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("items_org_tag_idx").on(table.organizationId, table.tag),
    index("items_org_status_idx").on(table.organizationId, table.status),
    index("items_org_location_idx").on(table.organizationId, table.locationId),
  ],
);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    itemId: uuid("item_id").notNull().references(() => items.id),
    objectKey: text("object_key").notNull(),
    originalName: text("original_name").notNull(),
    active: boolean("active").notNull().default(true),
    legacyBaserowId: text("legacy_baserow_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("photos_org_item_idx").on(table.organizationId, table.itemId)],
);

export const actions = pgTable(
  "actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    itemId: uuid("item_id").notNull().references(() => items.id),
    type: text("type").notNull(),
    actor: text("actor").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    legacyBaserowId: text("legacy_baserow_id"),
  },
  (table) => [index("actions_org_item_idx").on(table.organizationId, table.itemId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    name: text("name").notNull(),
    role: role("role").notNull().default("operator"),
    locationIds: text("location_ids").array().notNull().default([]),
    login: text("login").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("accounts_org_idx").on(table.organizationId)],
);
