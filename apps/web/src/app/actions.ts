"use server";

import { serverStore } from "@/lib/server-store";
import type { InventoryState, Item, Location, Role, Account } from "@/lib/types";
import { can } from "@/lib/permissions";

// Helper to remove passwords from the state before returning to the browser
function sanitizeState(state: InventoryState): InventoryState {
  return {
    ...state,
    accounts: state.accounts.map((acc) => ({
      ...acc,
      password: "",
    })),
  };
}

// Helper to look up an account and verify it exists
async function getAuthenticatedActor(accountId: string): Promise<Account> {
  const state = await serverStore.getState();
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) {
    throw new Error("Unauthorized: Account not found");
  }
  return account;
}

export async function getInventoryStateAction(): Promise<InventoryState> {
  return sanitizeState(await serverStore.getState());
}

export async function verifyCredentialsAction(login: string, passwordVal: string): Promise<Account | null> {
  return serverStore.verifyCredentials(login, passwordVal);
}

export async function updateItemAction(
  itemId: string,
  patch: Partial<Item>,
  actionType: string,
  accountId: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  // Authorization checks
  if (patch.name !== undefined || patch.tag !== undefined || patch.category !== undefined) {
    if (!can(userRole, "edit:item-core")) throw new Error("Forbidden: Cannot edit item core fields");
  }
  if (patch.locationId !== undefined) {
    if (!can(userRole, "edit:item-location")) throw new Error("Forbidden: Cannot edit item location");
  }
  if (patch.notes !== undefined) {
    if (!can(userRole, "edit:item-notes")) throw new Error("Forbidden: Cannot edit item notes");
  }
  if (patch.status !== undefined) {
    if (!can(userRole, "edit:item-status")) throw new Error("Forbidden: Cannot edit item status");
  }
  if (patch.frontPhotoId !== undefined) {
    if (!can(userRole, "manage:photos")) throw new Error("Forbidden: Cannot manage item photos");
  }

  return sanitizeState(await serverStore.updateItem(itemId, patch, actionType, userRole));
}

export async function createItemAction(locationId: string, accountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "edit:item-core")) {
    throw new Error("Forbidden: Cannot create items");
  }

  return sanitizeState(await serverStore.createItem(locationId, userRole));
}

export async function updateLocationAction(
  locationId: string,
  patch: Partial<Location>,
  accountId: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "edit:locations")) {
    throw new Error("Forbidden: Cannot edit locations");
  }

  return sanitizeState(await serverStore.updateLocation(locationId, patch));
}

export async function addLocationAction(name: string, notes: string, accountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "edit:locations")) {
    throw new Error("Forbidden: Cannot add locations");
  }

  return sanitizeState(await serverStore.addLocation(name, notes));
}

export async function addPhotosToItemAction(
  itemId: string,
  photosList: Array<{ url: string; originalName: string }>,
  accountId: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "add:photos")) {
    throw new Error("Forbidden: Cannot add photos");
  }

  return sanitizeState(await serverStore.addPhotosToItem(itemId, photosList, userRole));
}

export async function setFrontPhotoAction(itemId: string, photoId: string, accountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "manage:photos")) {
    throw new Error("Forbidden: Cannot set front photo");
  }

  return sanitizeState(await serverStore.setFrontPhoto(itemId, photoId, userRole));
}

export async function deactivatePhotoAction(itemId: string, photoId: string, accountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "manage:photos")) {
    throw new Error("Forbidden: Cannot deactivate photo");
  }

  return sanitizeState(await serverStore.deactivatePhoto(itemId, photoId, userRole));
}

export async function resetDemoAction(accountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  if (!can(userRole, "reset:demo")) {
    throw new Error("Forbidden: Cannot reset demo");
  }

  return sanitizeState(await serverStore.resetDemo());
}

export async function createAccountAction(
  accountId: string,
  name: string,
  locationIds: string[],
  customPassword?: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  const isManager = userRole === "owner" || userRole === "admin" || userRole === "manager";
  if (!isManager) {
    throw new Error("Forbidden: Cannot create accounts");
  }

  return sanitizeState(await serverStore.createAccount(name, locationIds, customPassword));
}

export async function deleteAccountAction(accountId: string, targetAccountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  const isManager = userRole === "owner" || userRole === "admin" || userRole === "manager";
  if (!isManager) {
    throw new Error("Forbidden: Cannot delete accounts");
  }

  return sanitizeState(await serverStore.deleteAccount(targetAccountId));
}

export async function changePasswordAction(
  accountId: string,
  targetAccountId: string,
  newPassword: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor(accountId);
  const userRole = actorAccount.role;

  const isManager = userRole === "owner" || userRole === "admin" || userRole === "manager";
  const isSelf = accountId === targetAccountId;

  if (!isManager && !isSelf) {
    throw new Error("Forbidden: Cannot change password for other accounts");
  }

  return sanitizeState(await serverStore.changePassword(targetAccountId, newPassword));
}
