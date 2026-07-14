import type { InventoryState } from "./types";

const now = new Date().toISOString();

export const demoState: InventoryState = {
  organization: {
    id: "org-sol12-demo",
    name: "SOL12 Demo",
    plan: "demo",
  },
  locations: [
    { id: "loc-annecy", name: "Annecy", notes: "Showroom et retours", active: true, createdAt: now, updatedAt: now },
    { id: "loc-geneve", name: "Geneve", notes: "Stock evenementiel", active: true, createdAt: now, updatedAt: now },
    { id: "loc-lyon", name: "Lyon", notes: "Atelier reparation", active: true, createdAt: now, updatedAt: now },
  ],
  items: [
    {
      id: "item-1001",
      tag: "1001",
      name: "Machine a cafe mobile",
      category: "Appliance",
      status: "AVAILABLE",
      locationId: "loc-annecy",
      notes: "Kit complet, prevoir capsules.",
      frontPhotoId: "photo-1001",
      lastAction: "NEW_ITEM",
      lastActionBy: "operator",
      lastActionAt: now,
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
      notes: "Louee pour evenement client.",
      frontPhotoId: null,
      lastAction: "SET_RENTED",
      lastActionBy: "manager",
      lastActionAt: now,
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
      notes: "Batterie a remplacer.",
      frontPhotoId: "photo-1003",
      lastAction: "SET_REPAIR",
      lastActionBy: "operator",
      lastActionAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item-1004",
      tag: "1004",
      name: "Lot rallonges electriques",
      category: "Accessory",
      status: "AVAILABLE",
      locationId: "loc-annecy",
      notes: "Controle le mois dernier.",
      frontPhotoId: null,
      lastAction: null,
      lastActionBy: null,
      lastActionAt: null,
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
    {
      id: "photo-1003-b",
      itemId: "item-1003",
      url: "https://images.unsplash.com/photo-1581147036324-c1c89c2c8b5c?auto=format&fit=crop&w=900&q=80",
      originalName: "tool-bench.jpg",
      active: true,
      createdAt: now,
    },
  ],
  actions: [
    { id: "act-1", itemId: "item-1001", type: "NEW_ITEM", actor: "operator", at: now },
    { id: "act-2", itemId: "item-1002", type: "SET_RENTED", actor: "manager", at: now },
    { id: "act-3", itemId: "item-1003", type: "SET_REPAIR", actor: "operator", at: now },
  ],
  accounts: [
    {
      id: "acc-manager",
      name: "Manager Général",
      role: "manager",
      locationIds: ["loc-annecy", "loc-geneve", "loc-lyon"],
      login: "mgeneral",
      password: "manager1",
      createdAt: now,
    },
    {
      id: "acc-op-annecy-geneve",
      name: "Opérateur Annecy & Genève",
      role: "operator",
      locationIds: ["loc-annecy", "loc-geneve"],
      login: "oannecy",
      password: "operator1",
      createdAt: now,
    },
    {
      id: "acc-op-lyon",
      name: "Opérateur Lyon",
      role: "operator",
      locationIds: ["loc-lyon"],
      login: "olyon",
      password: "operator2",
      createdAt: now,
    },
  ],
};

// Generate 100 DIY test items
const toolTypes = [
  { name: "Perceuse à percussion", category: "Tool" as const, keyword: "drill", photo: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80" },
  { name: "Marteau de charpentier", category: "Tool" as const, keyword: "hammer", photo: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80" },
  { name: "Scie circulaire pro", category: "Tool" as const, keyword: "saw", photo: "https://images.unsplash.com/photo-1549842784-ea23dfeb9965?auto=format&fit=crop&w=600&q=80" },
  { name: "Tournevis cruciforme bimatière", category: "Tool" as const, keyword: "screwdriver", photo: "https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=600&q=80" },
  { name: "Pince multiprise isolée", category: "Tool" as const, keyword: "wrench", photo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80" },
  { name: "Niveau à bulle antichoc", category: "Tool" as const, keyword: "level", photo: "https://images.unsplash.com/photo-1580983135655-4672764ee7ef?auto=format&fit=crop&w=600&q=80" },
  { name: "Projecteur de chantier LED", category: "Appliance" as const, keyword: "projector", photo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80" },
  { name: "Caisse à outils renforcée", category: "Accessory" as const, keyword: "toolbox", photo: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80" },
  { name: "Ponceuse vibrante", category: "Tool" as const, keyword: "sander", photo: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80" },
  { name: "Gants de protection chantier", category: "Accessory" as const, keyword: "gloves", photo: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80" },
  { name: "Mètre ruban autobloquant 5m", category: "Accessory" as const, keyword: "measure", photo: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80" },
  { name: "Scie sauteuse pendulaire", category: "Tool" as const, keyword: "saw", photo: "https://images.unsplash.com/photo-1549842784-ea23dfeb9965?auto=format&fit=crop&w=600&q=80" },
  { name: "Meuleuse d'angle compacte", category: "Tool" as const, keyword: "grinder", photo: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80" },
  { name: "Escabeau pro aluminium 6 marches", category: "Furniture" as const, keyword: "ladder", photo: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80" },
  { name: "Nettoyeur haute pression pro", category: "Appliance" as const, keyword: "washer", photo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80" },
  { name: "Casque de sécurité ventilé", category: "Accessory" as const, keyword: "helmet", photo: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=600&q=80" },
  { name: "Clé à molette grande ouverture", category: "Tool" as const, keyword: "wrench", photo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80" },
  { name: "Télémètre laser pro 50m", category: "Accessory" as const, keyword: "laser", photo: "https://images.unsplash.com/photo-1580983135655-4672764ee7ef?auto=format&fit=crop&w=600&q=80" },
  { name: "Pistolet à colle sans fil", category: "Appliance" as const, keyword: "glue", photo: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80" },
  { name: "Scie à onglet radiale inclinable", category: "Tool" as const, keyword: "saw", photo: "https://images.unsplash.com/photo-1549842784-ea23dfeb9965?auto=format&fit=crop&w=600&q=80" }
];

const brands = [
  "Bosch Professional",
  "Makita pro",
  "DeWalt pro",
  "Ryobi One+",
  "Stanley FatMax",
  "Facom Expert",
  "Milwaukee HD",
  "Black & Decker pro",
  "Metabo HPT",
  "Dremel Max"
];

const statuses = ["AVAILABLE", "RENTED", "REPAIR", "LOST"];
const locations = ["loc-annecy", "loc-geneve", "loc-lyon"];

if (typeof process === "undefined" || process.env.NODE_ENV !== "test") {
  for (let i = 1; i <= 100; i++) {
    const tagNum = 1004 + i;
    const toolType = toolTypes[(i - 1) % toolTypes.length];
    const brand = brands[Math.floor(i / toolTypes.length) % brands.length];
    const locationId = "loc-geneve";
    const status = statuses[i % statuses.length] as any;
    const itemId = `item-${tagNum}`;
    const photoId = `photo-${tagNum}`;

    demoState.items.push({
      id: itemId,
      tag: tagNum.toString(),
      name: `${toolType.name} ${brand}`,
      category: toolType.category,
      status: status,
      locationId: locationId,
      notes: `Matériel professionnel de test (${brand}). Contrôlé conforme.`,
      frontPhotoId: photoId,
      lastAction: "NEW_ITEM",
      lastActionBy: "operator",
      lastActionAt: now,
      createdAt: now,
      updatedAt: now,
    });

    demoState.photos.push({
      id: photoId,
      itemId: itemId,
      url: toolType.photo,
      originalName: `${toolType.keyword}-${brand.toLowerCase().replace(/\s/g, "-")}.jpg`,
      active: true,
      createdAt: now,
    });
  }
}

