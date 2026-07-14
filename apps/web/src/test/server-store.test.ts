import { describe, expect, it, beforeEach } from "vitest";
import { serverStore } from "@/lib/server-store";
import fs from "fs";
import path from "path";

const JSON_DB_PATH = path.join(process.cwd(), "db.json");

describe("serverStore persistence layer", () => {
  beforeEach(async () => {
    // Reset the demo store on server
    await serverStore.resetDemo();
  });

  it("loads the initial inventory state", async () => {
    const state = await serverStore.getState();
    expect(state.organization.id).toBe("org-sol12-demo");
    expect(state.locations).toHaveLength(3);
    expect(state.items).toHaveLength(4);
    expect(state.photos).toHaveLength(3);
    expect(state.actions).toHaveLength(3);
  });

  it("updates an item and appends a new action log entry", async () => {
    const original = await serverStore.getState();
    const item1001 = original.items.find((item) => item.id === "item-1001");
    expect(item1001?.status).toBe("AVAILABLE");

    const state = await serverStore.updateItem("item-1001", { status: "SOLD" }, "SET_SOLD", "admin");
    const updated = state.items.find((item) => item.id === "item-1001");
    expect(updated?.status).toBe("SOLD");
    expect(updated?.lastAction).toBe("SET_SOLD");
    expect(updated?.lastActionBy).toBe("admin");

    // Action was appended
    expect(state.actions.length).toBe(original.actions.length + 1);
    const lastAction = state.actions.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
    expect(lastAction?.type).toBe("SET_SOLD");
    expect(lastAction?.actor).toBe("admin");
  });

  it("creates a new item and increments the tag", async () => {
    const original = await serverStore.getState();
    const state = await serverStore.createItem("loc-annecy", "operator");
    expect(state.items.length).toBe(original.items.length + 1);

    const newItem = state.items.find((item) => !original.items.some((o) => o.id === item.id));
    expect(newItem?.tag).toBe("1005");
    expect(newItem?.locationId).toBe("loc-annecy");
    expect(newItem?.category).toBe("Other");

    expect(state.actions.length).toBe(original.actions.length + 1);
    const lastAction = state.actions.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
    expect(lastAction?.type).toBe("NEW_ITEM");
  });

  it("adds a new location", async () => {
    const original = await serverStore.getState();
    const state = await serverStore.addLocation("Bordeaux", "Nouveau bureau");
    expect(state.locations.length).toBe(original.locations.length + 1);

    const newLoc = state.locations.find((l) => l.name === "Bordeaux");
    expect(newLoc?.notes).toBe("Nouveau bureau");
    expect(newLoc?.active).toBe(true);
  });

  it("sets a photo as the front photo for an item", async () => {
    const state = await serverStore.setFrontPhoto("item-1003", "photo-1003-b", "manager");
    const item = state.items.find((i) => i.id === "item-1003");
    expect(item?.frontPhotoId).toBe("photo-1003-b");
  });

  it("deactivates a photo and unsets front photo if matching", async () => {
    // 1. Set front photo
    let state = await serverStore.setFrontPhoto("item-1003", "photo-1003-b", "manager");
    let item = state.items.find((i) => i.id === "item-1003");
    expect(item?.frontPhotoId).toBe("photo-1003-b");

    // 2. Deactivate it. Since photo-1003 is still active, it falls back to it.
    state = await serverStore.deactivatePhoto("item-1003", "photo-1003-b", "manager");
    const photoB = state.photos.find((p) => p.id === "photo-1003-b");
    expect(photoB?.active).toBe(false);

    item = state.items.find((i) => i.id === "item-1003");
    expect(item?.frontPhotoId).toBe("photo-1003");

    // 3. Deactivate photo-1003 too, now it must be null
    state = await serverStore.deactivatePhoto("item-1003", "photo-1003", "manager");
    const photoA = state.photos.find((p) => p.id === "photo-1003");
    expect(photoA?.active).toBe(false);

    item = state.items.find((i) => i.id === "item-1003");
    expect(item?.frontPhotoId).toBeNull();
  });

  it("manages operator accounts correctly", async () => {
    const original = await serverStore.getState();
    expect(original.accounts).toBeDefined();
    // Default seed has 3 accounts
    expect(original.accounts.length).toBe(3);

    // Create a new operator account
    const state = await serverStore.createAccount("New Operator", ["loc-annecy"]);
    expect(state.accounts.length).toBe(4);
    const created = state.accounts.find((a) => a.name === "New Operator");
    expect(created?.role).toBe("operator");
    expect(created?.locationIds).toEqual(["loc-annecy"]);
    expect(created?.login).toBe("noperator");
    expect(created?.password.startsWith("$2")).toBe(true);

    // Change password
    const stateAfterChange = await serverStore.changePassword(created!.id, "secret99");
    const updated = stateAfterChange.accounts.find((a) => a.id === created!.id);
    expect(updated?.password.startsWith("$2")).toBe(true);

    // Verify credentials work with the new password
    const verified = await serverStore.verifyCredentials(created!.login, "secret99");
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(created!.id);

    // Delete the operator account
    const finalState = await serverStore.deleteAccount(created!.id);
    expect(finalState.accounts.length).toBe(3);
    expect(finalState.accounts.find((a) => a.id === created!.id)).toBeUndefined();
  });
});
