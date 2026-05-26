import { describe, expect, it } from "vitest";
import { splitHighlightedText } from "@/lib/highlight";
import { addLocation, cloneDemoState, createItem, searchItems, summarizeInventory, updateItem } from "@/lib/inventory";

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
    expect(byName[0]?.name).toBe("Lot rallonges électriques");

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
    expect(splitHighlightedText("Machine à café", "cafe").some((part) => part.match)).toBe(true);
    expect(splitHighlightedText("Perceuse", "").map((part) => part.text).join("")).toBe("Perceuse");
  });

  it("creates an item and records an action", () => {
    const state = createItem(cloneDemoState(), "loc-annecy");
    expect(state.items[0]?.tag).toBe("1005");
    expect(state.actions[0]?.type).toBe("NEW_ITEM");
  });

  it("updates an item immutably", () => {
    const state = cloneDemoState();
    const next = updateItem(state, "item-1001", { status: "SOLD" }, "SET_SOLD");
    expect(state.items.find((item) => item.id === "item-1001")?.status).toBe("AVAILABLE");
    expect(next.items.find((item) => item.id === "item-1001")?.status).toBe("SOLD");
  });

  it("adds non-empty locations only", () => {
    const state = cloneDemoState();
    expect(addLocation(state, "  ").locations).toHaveLength(3);
    expect(addLocation(state, "Paris").locations).toHaveLength(4);
  });
});
