import { describe, expect, it } from "vitest";
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
