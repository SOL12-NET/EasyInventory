import type { Role } from "./types";

export type Capability =
  | "edit:item-core"
  | "edit:item-notes"
  | "edit:item-status"
  | "edit:item-location"
  | "edit:locations"
  | "add:photos"
  | "manage:photos"
  | "reset:demo";

const roleCapabilities: Record<Role, Capability[]> = {
  owner: ["edit:item-core", "edit:item-notes", "edit:item-status", "edit:item-location", "edit:locations", "add:photos", "manage:photos", "reset:demo"],
  admin: ["edit:item-core", "edit:item-notes", "edit:item-status", "edit:item-location", "edit:locations", "add:photos", "manage:photos", "reset:demo"],
  manager: ["edit:item-core", "edit:item-notes", "edit:item-status", "edit:item-location", "edit:locations", "add:photos", "manage:photos"],
  operator: ["edit:item-notes", "edit:item-status", "add:photos"],
};

export function can(role: Role, capability: Capability) {
  return roleCapabilities[role].includes(capability);
}

export function roleLabel(role: Role) {
  return {
    owner: "Owner",
    admin: "Admin",
    manager: "Manager",
    operator: "Operator",
  }[role];
}
