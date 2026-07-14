"use server";

import { serverStore } from "@/lib/server-store";
import type { InventoryState, Item, Location, Role, Account } from "@/lib/types";
import { can } from "@/lib/permissions";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { generateRandomPassword } from "@/lib/auth-helpers";

let fallbackSecret: string | null = null;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      if (!fallbackSecret) {
        fallbackSecret = crypto.randomBytes(32).toString("hex");
        console.warn("CRITICAL WARNING: SESSION_SECRET environment variable is not defined! A secure random key was generated in-memory as a fallback. Sessions will be invalidated upon server restart.");
      }
      return fallbackSecret;
    }
    return "development-only-fallback-session-secret-key-32-bytes-long";
  }
  return secret;
}

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

// Token signing helper
function signToken(payload: string): string {
  const secret = getSessionSecret();
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const signature = hmac.digest("base64url");
  return `${payload}.${signature}`;
}

// Token verification helper
function verifyToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const secret = getSessionSecret();
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return payload;
    }
  } catch {}
  return null;
}

// In-memory rate limiting map for login attempts per IP
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

function rateLimitLogin(ip: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  if (attempt) {
    if (now < attempt.lockUntil) {
      const waitTime = Math.ceil((attempt.lockUntil - now) / 1000);
      throw new Error(`Too many login attempts. Please wait ${waitTime} seconds.`);
    }
    if (attempt.count >= 5) {
      attempt.count = 1;
      attempt.lockUntil = now + 30000; // Lock for 30s
      throw new Error("Too many login attempts. Please wait 30 seconds.");
    }
    attempt.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, lockUntil: 0 });
  }
}

// Helper to look up an account and verify it exists from session cookie
async function getAuthenticatedActor(): Promise<Account> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) {
    throw new Error("Unauthorized: No session token found");
  }
  const accountId = verifyToken(token);
  if (!accountId) {
    throw new Error("Unauthorized: Invalid session token");
  }
  const state = await serverStore.getState();
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) {
    throw new Error("Unauthorized: Account not found");
  }
  return account;
}

export async function getInventoryStateAction(): Promise<{
  state: InventoryState;
  activeAccountId: string | null;
  demoPasswords?: Record<string, string>;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  let activeAccountId: string | null = null;
  if (token) {
    activeAccountId = verifyToken(token);
  }

  const rawState = await serverStore.getState();
  const sanitized = sanitizeState(rawState);

  const response: {
    state: InventoryState;
    activeAccountId: string | null;
    demoPasswords?: Record<string, string>;
  } = {
    state: sanitized,
    activeAccountId,
  };

  if (rawState.organization.plan === "demo") {
    response.demoPasswords = {
      mgeneral: "manager1",
      oannecy: "operator1",
      olyon: "operator2",
    };
  }

  return response;
}

export async function verifyCredentialsAction(login: string, passwordVal: string): Promise<Account | null> {
  const reqHeaders = await headers();
  const clientIp = reqHeaders.get("x-real-ip") || reqHeaders.get("x-forwarded-for")?.split(',')[0].trim() || "unknown-ip";
  
  rateLimitLogin(clientIp);

  const account = await serverStore.verifyCredentials(login, passwordVal);
  if (account) {
    loginAttempts.delete(clientIp);
    const token = signToken(account.id);
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return account;
  }
  return null;
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
}

export async function updateItemAction(
  itemId: string,
  patch: Partial<Item>,
  actionType: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
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

export async function createItemAction(locationId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "edit:item-core")) {
    throw new Error("Forbidden: Cannot create items");
  }

  return sanitizeState(await serverStore.createItem(locationId, userRole));
}

export async function updateLocationAction(
  locationId: string,
  patch: Partial<Location>,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "edit:locations")) {
    throw new Error("Forbidden: Cannot edit locations");
  }

  return sanitizeState(await serverStore.updateLocation(locationId, patch));
}

export async function addLocationAction(name: string, notes: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "edit:locations")) {
    throw new Error("Forbidden: Cannot add locations");
  }

  return sanitizeState(await serverStore.addLocation(name, notes));
}

export async function addPhotosToItemAction(
  itemId: string,
  photosList: Array<{ url: string; originalName: string }>,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "add:photos")) {
    throw new Error("Forbidden: Cannot add photos");
  }

  return sanitizeState(await serverStore.addPhotosToItem(itemId, photosList, userRole));
}

export async function setFrontPhotoAction(itemId: string, photoId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "manage:photos")) {
    throw new Error("Forbidden: Cannot set front photo");
  }

  return sanitizeState(await serverStore.setFrontPhoto(itemId, photoId, userRole));
}

export async function deactivatePhotoAction(itemId: string, photoId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "manage:photos")) {
    throw new Error("Forbidden: Cannot deactivate photo");
  }

  return sanitizeState(await serverStore.deactivatePhoto(itemId, photoId, userRole));
}

export async function resetDemoAction(): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  if (!can(userRole, "reset:demo")) {
    throw new Error("Forbidden: Cannot reset demo");
  }

  return sanitizeState(await serverStore.resetDemo());
}

export async function createAccountAction(
  name: string,
  locationIds: string[],
  customPassword?: string,
): Promise<{ state: InventoryState; passwordUsed: string }> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  const isManager = userRole === "owner" || userRole === "admin" || userRole === "manager";
  if (!isManager) {
    throw new Error("Forbidden: Cannot create accounts");
  }

  const passwordUsed = customPassword || generateRandomPassword();
  const nextState = sanitizeState(await serverStore.createAccount(name, locationIds, passwordUsed));
  return { state: nextState, passwordUsed };
}

export async function deleteAccountAction(targetAccountId: string): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;

  const isManager = userRole === "owner" || userRole === "admin" || userRole === "manager";
  if (!isManager) {
    throw new Error("Forbidden: Cannot delete accounts");
  }

  return sanitizeState(await serverStore.deleteAccount(targetAccountId));
}

export async function changePasswordAction(
  targetAccountId: string,
  newPassword: string,
): Promise<InventoryState> {
  const actorAccount = await getAuthenticatedActor();
  const userRole = actorAccount.role;
  const accountId = actorAccount.id;

  const isManager = userRole === "owner" || userRole === "admin" || userRole === "manager";
  const isSelf = accountId === targetAccountId;

  if (!isManager && !isSelf) {
    throw new Error("Forbidden: Cannot change password for other accounts");
  }

  return sanitizeState(await serverStore.changePassword(targetAccountId, newPassword));
}
