import { ADMIN_SENTINEL_ADDRESS } from "./auth";

/**
 * Role-Based Access Control for the admin dashboard.
 * Roles: owner > admin > operator > viewer
 */

export type Role = "owner" | "admin" | "operator" | "viewer";

export interface RBACUser {
  address: string;
  role: Role;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 100,
  admin: 75,
  operator: 50,
  viewer: 25,
};

type Permission =
  | "config:read"
  | "config:write"
  | "contracts:read"
  | "contracts:deploy"
  | "relay:execute"
  | "analytics:read"
  | "logs:read"
  | "logs:delete"
  | "domains:read"
  | "domains:manage"
  | "settings:read"
  | "settings:write"
  | "users:read"
  | "users:manage"
  | "sdk:compile"
  | "sdk:download";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: [
    "config:read",
    "contracts:read",
    "analytics:read",
    "logs:read",
    "domains:read",
    "settings:read",
  ],
  operator: [
    "config:read",
    "config:write",
    "contracts:read",
    "contracts:deploy",
    "relay:execute",
    "analytics:read",
    "logs:read",
    "domains:read",
    "domains:manage",
    "settings:read",
    "sdk:compile",
    "sdk:download",
  ],
  admin: [
    "config:read",
    "config:write",
    "contracts:read",
    "contracts:deploy",
    "relay:execute",
    "analytics:read",
    "logs:read",
    "logs:delete",
    "domains:read",
    "domains:manage",
    "settings:read",
    "settings:write",
    "users:read",
    "sdk:compile",
    "sdk:download",
  ],
  owner: [
    "config:read",
    "config:write",
    "contracts:read",
    "contracts:deploy",
    "relay:execute",
    "analytics:read",
    "logs:read",
    "logs:delete",
    "domains:read",
    "domains:manage",
    "settings:read",
    "settings:write",
    "users:read",
    "users:manage",
    "sdk:compile",
    "sdk:download",
  ],
};

/** Check if a role has a specific permission */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Check if roleA >= roleB in hierarchy */
export function isAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Resolve user role from address.
 * In production, this reads from Redis/DB. For now, env-based.
 * OWNER_ADDRESS env var gets "owner" role; all others get "viewer".
 */
export function resolveRole(address: string): Role {
  if (address === ADMIN_SENTINEL_ADDRESS) return "owner";
  const ownerAddr = process.env.OWNER_ADDRESS?.toLowerCase();
  const adminAddrs = (process.env.ADMIN_ADDRESSES || "").toLowerCase().split(",").filter(Boolean);
  const operatorAddrs = (process.env.OPERATOR_ADDRESSES || "").toLowerCase().split(",").filter(Boolean);

  const addr = address.toLowerCase();
  if (ownerAddr && addr === ownerAddr) return "owner";
  if (adminAddrs.includes(addr)) return "admin";
  if (operatorAddrs.includes(addr)) return "operator";
  return "viewer";
}

/** Middleware helper — returns null if authorized, or an error response */
export function authorize(address: string | null, permission: Permission): string | null {
  if (!address) return "Authentication required";
  const role = resolveRole(address);
  if (!hasPermission(role, permission)) {
    return `Insufficient permissions: ${role} cannot ${permission}`;
  }
  return null;
}
