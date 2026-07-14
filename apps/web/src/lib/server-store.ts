import fs from "fs";
import path from "path";
import { db, hasDbConfig } from "./db";
import { organizations, locations, items, photos, actions, accounts } from "./schema";
import { eq, desc, and } from "drizzle-orm";
import { demoState } from "./seed";
import {
  cloneDemoState,
  createItem as pureCreateItem,
  updateItem as pureUpdateItem,
  updateLocation as pureUpdateLocation,
  addLocation as pureAddLocation,
  addPhotosToItem as pureAddPhotosToItem,
  setFrontPhoto as pureSetFrontPhoto,
  deactivatePhoto as pureDeactivatePhoto,
} from "./inventory";
import type { InventoryState, Item, Location, Photo, InventoryAction, Role, Account } from "./types";
import { generateLogin, generateRandomPassword } from "./auth-helpers";

const DEMO_ORG_ID = "org-sol12-demo";
const JSON_DB_PATH = path.join(
  process.cwd(),
  process.env.NODE_ENV === "test" ? "db.test.json" : "db.json"
);

// Helper to load state from JSON file
function loadJsonState(): InventoryState {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = fs.readFileSync(JSON_DB_PATH, "utf-8");
      const state = JSON.parse(data) as InventoryState;
      if (!state.accounts) {
        state.accounts = cloneDemoState().accounts;
        saveJsonState(state);
      } else {
        let modified = false;
        state.accounts = state.accounts.map((acc) => {
          if (!acc.login || !acc.password) {
            const seedAcc = cloneDemoState().accounts.find((sa) => sa.id === acc.id);
            modified = true;
            return {
              ...acc,
              login: acc.login || seedAcc?.login || "user",
              password: acc.password || seedAcc?.password || "password123",
            };
          }
          return acc;
        });
        if (modified) {
          saveJsonState(state);
        }
      }
      return state;
    }
  } catch (error) {
    console.error("Error reading JSON db:", error);
  }
  // Initialize and save demo state if file doesn't exist
  const state = cloneDemoState();
  saveJsonState(state);
  return state;
}

// Helper to save state to JSON file
function saveJsonState(state: InventoryState): void {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing JSON db:", error);
  }
}

// Helper to seed PostgreSQL
async function seedPostgres(orgId: string) {
  if (!db) return;

  // Insert organization
  await db.insert(organizations).values({
    id: orgId,
    name: demoState.organization.name,
    plan: demoState.organization.plan,
  }).onConflictDoNothing();

  // Insert locations
  for (const loc of demoState.locations) {
    await db.insert(locations).values({
      id: loc.id,
      organizationId: orgId,
      name: loc.name,
      notes: loc.notes,
      active: loc.active,
    }).onConflictDoNothing();
  }

  // Insert items
  for (const item of demoState.items) {
    await db.insert(items).values({
      id: item.id,
      organizationId: orgId,
      tag: item.tag,
      name: item.name,
      category: item.category,
      status: item.status,
      locationId: item.locationId,
      notes: item.notes,
      frontPhotoId: item.frontPhotoId,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    }).onConflictDoNothing();
  }

  // Insert photos
  for (const photo of demoState.photos) {
    await db.insert(photos).values({
      id: photo.id,
      organizationId: orgId,
      itemId: photo.itemId,
      objectKey: photo.url,
      originalName: photo.originalName,
      active: photo.active,
      createdAt: photo.createdAt ? new Date(photo.createdAt) : undefined,
    }).onConflictDoNothing();
  }

  // Insert actions
  for (const act of demoState.actions) {
    await db.insert(actions).values({
      id: act.id,
      organizationId: orgId,
      itemId: act.itemId,
      type: act.type,
      actor: act.actor,
      at: act.at ? new Date(act.at) : undefined,
    }).onConflictDoNothing();
  }

  // Insert accounts
  for (const acc of demoState.accounts) {
    await db.insert(accounts).values({
      id: acc.id,
      organizationId: orgId,
      name: acc.name,
      role: acc.role,
      locationIds: acc.locationIds,
      login: acc.login,
      password: acc.password,
      createdAt: acc.createdAt ? new Date(acc.createdAt) : undefined,
    }).onConflictDoNothing();
  }
}

// PostgreSQL State Loader
async function getPostgresState(orgId: string): Promise<InventoryState> {
  if (!db) throw new Error("Database not connected");

  let org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) {
    await seedPostgres(orgId);
    org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
  }

  const locs = await db.query.locations.findMany({
    where: eq(locations.organizationId, orgId),
  });

  const dbItems = await db.query.items.findMany({
    where: eq(items.organizationId, orgId),
  });

  const dbPhotos = await db.query.photos.findMany({
    where: eq(photos.organizationId, orgId),
  });

  const dbActions = await db.query.actions.findMany({
    where: eq(actions.organizationId, orgId),
  });

  const dbAccounts = await db.query.accounts.findMany({
    where: eq(accounts.organizationId, orgId),
  });

  return {
    organization: {
      id: org!.id,
      name: org!.name,
      plan: org!.plan as "demo" | "pro",
    },
    locations: locs.map((l) => ({
      id: l.id,
      name: l.name,
      notes: l.notes,
      active: l.active,
    })),
    items: dbItems.map((i) => {
      const itemActions = dbActions
        .filter((a) => a.itemId === i.id)
        .sort((a, b) => b.at.getTime() - a.at.getTime());
      const lastAction = itemActions[0] ?? null;
      return {
        id: i.id,
        tag: i.tag,
        name: i.name,
        category: i.category,
        status: i.status as any,
        locationId: i.locationId,
        notes: i.notes,
        frontPhotoId: i.frontPhotoId,
        lastAction: lastAction?.type ?? null,
        lastActionBy: lastAction?.actor ?? null,
        lastActionAt: lastAction?.at?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      };
    }),
    photos: dbPhotos.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      url: p.objectKey,
      originalName: p.originalName,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
    })),
    actions: dbActions.map((a) => ({
      id: a.id,
      itemId: a.itemId,
      type: a.type,
      actor: a.actor,
      at: a.at.toISOString(),
    })),
    accounts: dbAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role as any,
      locationIds: a.locationIds,
      login: a.login,
      password: a.password,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export const serverStore = {
  async getState(): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Database query failed, falling back to JSON storage:", error);
      }
    }
    return loadJsonState();
  },

  async updateItem(itemId: string, patch: Partial<Item>, actionType: string, actor: Role): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const now = new Date();
        await db.update(items)
          .set({
            ...(patch.tag !== undefined && { tag: patch.tag }),
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.category !== undefined && { category: patch.category }),
            ...(patch.status !== undefined && { status: patch.status }),
            ...(patch.locationId !== undefined && { locationId: patch.locationId }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
            ...(patch.frontPhotoId !== undefined && { frontPhotoId: patch.frontPhotoId }),
            updatedAt: now,
          })
          .where(eq(items.id, itemId));

        await db.insert(actions).values({
          organizationId: DEMO_ORG_ID,
          itemId,
          type: actionType,
          actor,
          at: now,
        });

        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres updateItem failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureUpdateItem(state, itemId, patch, actionType, actor);
    saveJsonState(next);
    return next;
  },

  async createItem(locationId: string, actor: Role): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const now = new Date();
        const orgId = DEMO_ORG_ID;

        // Find max tag to increment it
        const dbItems = await db.query.items.findMany({
          where: eq(items.organizationId, orgId),
        });
        const tags = dbItems.map((i) => Number(i.tag)).filter((n) => !Number.isNaN(n));
        const nextTag = tags.length > 0 ? Math.max(...tags) + 1 : 1001;

        const itemId = crypto.randomUUID();

        await db.insert(items).values({
          id: itemId,
          organizationId: orgId,
          tag: String(nextTag),
          name: `Nouveau matériel #${nextTag}`,
          category: "Other",
          status: "AVAILABLE",
          locationId,
          notes: "",
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(actions).values({
          organizationId: orgId,
          itemId,
          type: "NEW_ITEM",
          actor,
          at: now,
        });

        return await getPostgresState(orgId);
      } catch (error) {
        console.error("Postgres createItem failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureCreateItem(state, locationId, actor);
    saveJsonState(next);
    return next;
  },

  async updateLocation(locationId: string, patch: Partial<Location>): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        await db.update(locations)
          .set({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
            ...(patch.active !== undefined && { active: patch.active }),
          })
          .where(eq(locations.id, locationId));

        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres updateLocation failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureUpdateLocation(state, locationId, patch);
    saveJsonState(next);
    return next;
  },

  async addLocation(name: string, notes: string): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const locId = crypto.randomUUID();
        await db.insert(locations).values({
          id: locId,
          organizationId: DEMO_ORG_ID,
          name,
          notes,
          active: true,
        });

        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres addLocation failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureAddLocation(state, name, notes);
    saveJsonState(next);
    return next;
  },

  async addPhotosToItem(itemId: string, photosList: Array<{ url: string; originalName: string }>, actor: Role): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const now = new Date();
        for (const file of photosList) {
          const photoId = crypto.randomUUID();
          await db.insert(photos).values({
            id: photoId,
            organizationId: DEMO_ORG_ID,
            itemId,
            objectKey: file.url,
            originalName: file.originalName,
            active: true,
            createdAt: now,
          });
        }

        await db.insert(actions).values({
          organizationId: DEMO_ORG_ID,
          itemId,
          type: "ADD_PHOTO",
          actor,
          at: now,
        });

        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres addPhotosToItem failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureAddPhotosToItem(state, itemId, photosList, actor);
    saveJsonState(next);
    return next;
  },

  async setFrontPhoto(itemId: string, photoId: string, actor: Role): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const now = new Date();
        await db.update(items)
          .set({
            frontPhotoId: photoId,
            updatedAt: now,
          })
          .where(eq(items.id, itemId));

        await db.insert(actions).values({
          organizationId: DEMO_ORG_ID,
          itemId,
          type: "SET_FRONT_PHOTO",
          actor,
          at: now,
        });

        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres setFrontPhoto failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureSetFrontPhoto(state, itemId, photoId, actor);
    saveJsonState(next);
    return next;
  },

  async deactivatePhoto(itemId: string, photoId: string, actor: Role): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const now = new Date();
        await db.update(photos)
          .set({ active: false })
          .where(eq(photos.id, photoId));

        // If this photo was the frontPhotoId, unset it
        const item = await db.query.items.findFirst({
          where: eq(items.id, itemId),
        });
        if (item && item.frontPhotoId === photoId) {
          await db.update(items)
            .set({ frontPhotoId: null, updatedAt: now })
            .where(eq(items.id, itemId));
        }

        await db.insert(actions).values({
          organizationId: DEMO_ORG_ID,
          itemId,
          type: "DEACTIVATE_PHOTO",
          actor,
          at: now,
        });

        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres deactivatePhoto failed:", error);
      }
    }

    const state = loadJsonState();
    const next = pureDeactivatePhoto(state, itemId, photoId, actor);
    saveJsonState(next);
    return next;
  },

  async resetDemo(): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        // Clear demo entries
        await db.delete(actions).where(eq(actions.organizationId, DEMO_ORG_ID));
        await db.delete(photos).where(eq(photos.organizationId, DEMO_ORG_ID));
        await db.delete(items).where(eq(items.organizationId, DEMO_ORG_ID));
        await db.delete(locations).where(eq(locations.organizationId, DEMO_ORG_ID));
        await db.delete(accounts).where(eq(accounts.organizationId, DEMO_ORG_ID));
        await db.delete(organizations).where(eq(organizations.id, DEMO_ORG_ID));

        await seedPostgres(DEMO_ORG_ID);
        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres resetDemo failed:", error);
      }
    }

    const next = cloneDemoState();
    saveJsonState(next);
    return next;
  },

  async createAccount(name: string, locationIds: string[], customPassword?: string): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        const accs = await db.query.accounts.findMany({
          where: eq(accounts.organizationId, DEMO_ORG_ID),
        });
        const existingLogins = accs.map((a) => a.login);
        const login = generateLogin(name, existingLogins);
        const password = customPassword || generateRandomPassword();
        const accId = crypto.randomUUID();
        await db.insert(accounts).values({
          id: accId,
          organizationId: DEMO_ORG_ID,
          name,
          role: "operator",
          locationIds,
          login,
          password,
        });
        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres createAccount failed:", error);
      }
    }

    const state = loadJsonState();
    const existingLogins = state.accounts.map((a) => a.login);
    const login = generateLogin(name, existingLogins);
    const password = customPassword || generateRandomPassword();
    const at = new Date().toISOString();
    const nextAccounts = [
      ...state.accounts,
      {
        id: crypto.randomUUID(),
        name,
        role: "operator" as const,
        locationIds,
        login,
        password,
        createdAt: at,
      },
    ];
    const next = { ...state, accounts: nextAccounts };
    saveJsonState(next);
    return next;
  },

  async deleteAccount(accountId: string): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        await db.delete(accounts).where(eq(accounts.id, accountId));
        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres deleteAccount failed:", error);
      }
    }

    const state = loadJsonState();
    const next = { ...state, accounts: state.accounts.filter((a) => a.id !== accountId) };
    saveJsonState(next);
    return next;
  },

  async changePassword(accountId: string, newPassword: string): Promise<InventoryState> {
    if (hasDbConfig && db) {
      try {
        await db.update(accounts)
          .set({ password: newPassword })
          .where(eq(accounts.id, accountId));
        return await getPostgresState(DEMO_ORG_ID);
      } catch (error) {
        console.error("Postgres changePassword failed:", error);
      }
    }

    const state = loadJsonState();
    const next = {
      ...state,
      accounts: state.accounts.map((a) => (a.id === accountId ? { ...a, password: newPassword } : a)),
    };
    saveJsonState(next);
    return next;
  },

  async verifyCredentials(login: string, passwordVal: string): Promise<Account | null> {
    if (hasDbConfig && db) {
      try {
        const account = await db.query.accounts.findFirst({
          where: eq(accounts.login, login),
        });
        if (account && account.password === passwordVal) {
          return {
            id: account.id,
            name: account.name,
            role: account.role as any,
            locationIds: account.locationIds,
            login: account.login,
            password: "",
            createdAt: account.createdAt.toISOString(),
          };
        }
        return null;
      } catch (error) {
        console.error("Postgres verifyCredentials failed:", error);
      }
    }

    const state = loadJsonState();
    const account = state.accounts.find(
      (a) => a.login.toLowerCase() === login.toLowerCase() && a.password === passwordVal
    );
    if (account) {
      return {
        ...account,
        password: "",
      };
    }
    return null;
  },
};
