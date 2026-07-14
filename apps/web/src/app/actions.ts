"use server";

import { serverStore } from "@/lib/server-store";
import type { InventoryState, Item, Location, Role } from "@/lib/types";

export async function getInventoryStateAction(): Promise<InventoryState> {
  return serverStore.getState();
}

export async function updateItemAction(
  itemId: string,
  patch: Partial<Item>,
  actionType: string,
  actor: Role,
): Promise<InventoryState> {
  return serverStore.updateItem(itemId, patch, actionType, actor);
}

export async function createItemAction(locationId: string, actor: Role): Promise<InventoryState> {
  return serverStore.createItem(locationId, actor);
}

export async function updateLocationAction(locationId: string, patch: Partial<Location>): Promise<InventoryState> {
  return serverStore.updateLocation(locationId, patch);
}

export async function addLocationAction(name: string, notes: string): Promise<InventoryState> {
  return serverStore.addLocation(name, notes);
}

export async function addPhotosToItemAction(
  itemId: string,
  photosList: Array<{ url: string; originalName: string }>,
  actor: Role,
): Promise<InventoryState> {
  return serverStore.addPhotosToItem(itemId, photosList, actor);
}

export async function setFrontPhotoAction(itemId: string, photoId: string, actor: Role): Promise<InventoryState> {
  return serverStore.setFrontPhoto(itemId, photoId, actor);
}

export async function deactivatePhotoAction(itemId: string, photoId: string, actor: Role): Promise<InventoryState> {
  return serverStore.deactivatePhoto(itemId, photoId, actor);
}

export async function resetDemoAction(): Promise<InventoryState> {
  return serverStore.resetDemo();
}

export async function createAccountAction(name: string, locationIds: string[], customPassword?: string): Promise<InventoryState> {
  return serverStore.createAccount(name, locationIds, customPassword);
}

export async function deleteAccountAction(accountId: string): Promise<InventoryState> {
  return serverStore.deleteAccount(accountId);
}

export async function changePasswordAction(accountId: string, newPassword: string): Promise<InventoryState> {
  return serverStore.changePassword(accountId, newPassword);
}
