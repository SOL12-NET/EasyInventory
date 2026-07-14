import { describe, expect, it } from "vitest";
import { splitHighlightedText } from "@/lib/highlight";
import {
  addLocation,
  addPhotosToItem,
  cloneDemoState,
  createItem,
  deactivatePhoto,
  getItemActions,
  getItemPhotos,
  searchItems,
  setFrontPhoto,
  summarizeInventory,
  updateItem,
  updateLocation,
} from "@/lib/inventory";
import { can } from "@/lib/permissions";
import { generateLogin, generateRandomPassword } from "@/lib/auth-helpers";

describe("inventory domain", () => {
  it("computes dashboard metrics", () => {
    const summary = summarizeInventory(cloneDemoState());
    expect(summary.total).toBe(4);
    expect(summary.missingFront).toBe(2);
    expect(summary.byStatus.AVAILABLE).toBe(2);
  });

  it("filters search by text, location and status", () => {
    const state = cloneDemoState();
    const item = searchItems(state, "table", "loc-geneve", "RENTED");
    expect(item).toHaveLength(1);
    expect(item[0]?.tag).toBe("1002");
  });

  it("searches by tag", () => {
    const state = cloneDemoState();
    const item = searchItems(state, "1003");
    expect(item).toHaveLength(1);
    expect(item[0]?.name).toBe("Perceuse sans fil");
  });

  it("searches accent-insensitive names and notes", () => {
    const state = cloneDemoState();
    expect(searchItems(state, "cafe")[0]?.tag).toBe("1001");
    expect(searchItems(state, "prevoir")[0]?.tag).toBe("1001");
  });

  it("filters by location and category", () => {
    const state = cloneDemoState();
    const items = searchItems(state, "", "loc-annecy", "all", "Accessory");
    expect(items).toHaveLength(1);
    expect(items[0]?.tag).toBe("1004");
  });

  it("sorts by tag, name and recent updates", () => {
    const state = cloneDemoState();
    const byTag = searchItems(state, "", "all", "all", "all", "tag");
    expect(byTag.map((item) => item.tag)).toEqual(["1001", "1002", "1003", "1004"]);

    const byName = searchItems(state, "", "all", "all", "all", "name");
    expect(byName[0]?.name).toBe("Lot rallonges electriques");

    const recentState = {
      ...state,
      items: state.items.map((item) =>
        item.id === "item-1002" ? { ...item, updatedAt: "2030-01-01T00:00:00.000Z" } : item,
      ),
    };
    expect(searchItems(recentState, "", "all", "all", "all", "recent")[0]?.tag).toBe("1002");
  });

  it("splits highlighted text safely", () => {
    expect(splitHighlightedText(null, "x")).toEqual([{ id: "0", text: "", match: false }]);
    expect(splitHighlightedText("Machine a cafe", "cafe").some((part) => part.match)).toBe(true);
    expect(splitHighlightedText("Perceuse", "").map((part) => part.text).join("")).toBe("Perceuse");
  });

  it("creates an item and records an action", () => {
    const state = createItem(cloneDemoState(), "loc-annecy");
    expect(state.items[0]?.tag).toBe("1005");
    expect(state.actions[0]?.type).toBe("NEW_ITEM");
  });

  it("updates an item immutably and mirrors last action fields", () => {
    const state = cloneDemoState();
    const next = updateItem(state, "item-1001", { status: "SOLD" }, "SET_SOLD", "manager");
    expect(state.items.find((item) => item.id === "item-1001")?.status).toBe("AVAILABLE");
    expect(next.items.find((item) => item.id === "item-1001")?.status).toBe("SOLD");
    expect(next.items.find((item) => item.id === "item-1001")?.lastActionBy).toBe("manager");
  });

  it("adds non-empty locations only", () => {
    const state = cloneDemoState();
    expect(addLocation(state, "  ").locations).toHaveLength(3);
    expect(addLocation(state, "Paris").locations).toHaveLength(4);
  });

  it("orders gallery photos with the front photo first", () => {
    const state = cloneDemoState();
    const next = setFrontPhoto(state, "item-1003", "photo-1003-b", "manager");
    expect(getItemPhotos(next, next.items.find((item) => item.id === "item-1003") ?? null)[0]?.id).toBe("photo-1003-b");
  });

  it("adds and deactivates photos while recording history", () => {
    const state = addPhotosToItem(cloneDemoState(), "item-1002", [{ url: "data:image/png;base64,test", originalName: "table.png" }], "operator");
    const photo = getItemPhotos(state, state.items.find((item) => item.id === "item-1002") ?? null)[0];
    expect(photo?.originalName).toBe("table.png");
    const next = deactivatePhoto(state, "item-1002", photo?.id ?? "", "manager");
    expect(getItemPhotos(next, next.items.find((item) => item.id === "item-1002") ?? null)).toHaveLength(0);
    expect(getItemActions(next, "item-1002")[0]?.type).toBe("PHOTO_UNLINK");
  });

  it("updates locations and keeps inactive locations out of active metrics", () => {
    const state = updateLocation(cloneDemoState(), "loc-annecy", { active: false, notes: "Closed" });
    expect(state.locations.find((location) => location.id === "loc-annecy")?.notes).toBe("Closed");
    expect(summarizeInventory(state).byLocation.some((location) => location.locationId === "loc-annecy")).toBe(false);
  });

  it("enforces demo role capabilities", () => {
    expect(can("operator", "edit:item-status")).toBe(true);
    expect(can("operator", "manage:photos")).toBe(false);
    expect(can("manager", "manage:photos")).toBe(true);
    expect(can("owner", "reset:demo")).toBe(true);
  });

  it("generates unique logins based on first name and last name", () => {
    const existing = ["jdupont", "jedupont"];
    
    // First letter + last name
    expect(generateLogin("Marc Dupont", existing)).toBe("mdupont");
    
    // Collides with jdupont -> tries two letters: jedupont -> tries three letters: jeadupont
    expect(generateLogin("Jean Dupont", existing)).toBe("jeadupont");
    
    // Collides with everything -> appends a number
    const allExisting = ["jdupont", "jedupont", "jeadupont", "jeandupont"];
    expect(generateLogin("Jean Dupont", allExisting)).toBe("jdupont2");
  });

  it("generates secure random passwords of 8 characters", () => {
    const pass1 = generateRandomPassword();
    const pass2 = generateRandomPassword();
    expect(pass1).toHaveLength(8);
    expect(pass2).toHaveLength(8);
    expect(pass1).not.toBe(pass2);
  });
});
