import type { InventoryState } from "./types";

const now = new Date().toISOString();

export const demoState: InventoryState = {
  organization: {
    id: "org-sol12-demo",
    name: "SOL12 Demo",
    plan: "demo",
  },
  locations: [
    { id: "loc-annecy", name: "Annecy", notes: "Showroom et retours", active: true },
    { id: "loc-geneve", name: "Geneve", notes: "Stock événementiel", active: true },
    { id: "loc-lyon", name: "Lyon", notes: "Atelier réparation", active: true },
  ],
  items: [
    {
      id: "item-1001",
      tag: "1001",
      name: "Machine à café mobile",
      category: "Appliance",
      status: "AVAILABLE",
      locationId: "loc-annecy",
      notes: "Kit complet, prévoir capsules.",
      frontPhotoId: "photo-1001",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item-1002",
      tag: "1002",
      name: "Table pliante XL",
      category: "Furniture",
      status: "RENTED",
      locationId: "loc-geneve",
      notes: "Louée pour événement client.",
      frontPhotoId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item-1003",
      tag: "1003",
      name: "Perceuse sans fil",
      category: "Tool",
      status: "REPAIR",
      locationId: "loc-lyon",
      notes: "Batterie à remplacer.",
      frontPhotoId: "photo-1003",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item-1004",
      tag: "1004",
      name: "Lot rallonges électriques",
      category: "Accessory",
      status: "AVAILABLE",
      locationId: "loc-annecy",
      notes: "Contrôlé le mois dernier.",
      frontPhotoId: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
  photos: [
    {
      id: "photo-1001",
      itemId: "item-1001",
      url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80",
      originalName: "coffee-machine.jpg",
      active: true,
      createdAt: now,
    },
    {
      id: "photo-1003",
      itemId: "item-1003",
      url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
      originalName: "drill.jpg",
      active: true,
      createdAt: now,
    },
  ],
  actions: [
    { id: "act-1", itemId: "item-1001", type: "NEW_ITEM", actor: "operator", at: now },
    { id: "act-2", itemId: "item-1002", type: "SET_RENTED", actor: "manager", at: now },
    { id: "act-3", itemId: "item-1003", type: "SET_REPAIR", actor: "operator", at: now },
  ],
};
