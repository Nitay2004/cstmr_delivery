export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export interface Permissions {
  viewPickupRequests: boolean;
  createPickupRequest: boolean;
  editPickupRequest: boolean;
  deletePickupRequest: boolean;
  importPickupRequests: boolean;
  uploadFiles: boolean;
  manageUsers: boolean;
}

export type PermissionKey = keyof Permissions;

export function emptyPermissions(): Permissions {
  return {
    viewPickupRequests: false,
    createPickupRequest: false,
    editPickupRequest: false,
    deletePickupRequest: false,
    importPickupRequests: false,
    uploadFiles: false,
    manageUsers: false,
  };
}

export const ROLE_PRESETS: Record<Role, Permissions> = {
  ADMIN: {
    viewPickupRequests: true,
    createPickupRequest: true,
    editPickupRequest: true,
    deletePickupRequest: true,
    importPickupRequests: true,
    uploadFiles: true,
    manageUsers: true,
  },
  EDITOR: {
    viewPickupRequests: true,
    createPickupRequest: true,
    editPickupRequest: true,
    deletePickupRequest: false,
    importPickupRequests: true,
    uploadFiles: true,
    manageUsers: false,
  },
  VIEWER: {
    viewPickupRequests: true,
    createPickupRequest: false,
    editPickupRequest: false,
    deletePickupRequest: false,
    importPickupRequests: false,
    uploadFiles: false,
    manageUsers: false,
  },
};

export const ROLES: Role[] = ["ADMIN", "EDITOR", "VIEWER"];

export const PERMISSION_DEFS: {
  key: PermissionKey;
  label: string;
  description: string;
}[] = [
  {
    key: "viewPickupRequests",
    label: "View Pickup Requests",
    description: "See the pickup requests page and data.",
  },
  {
    key: "createPickupRequest",
    label: "Create Pickup Requests",
    description: "Create new pickup requests.",
  },
  {
    key: "editPickupRequest",
    label: "Edit Pickup Requests",
    description: "Edit existing pickup requests.",
  },
  {
    key: "deletePickupRequest",
    label: "Delete Pickup Requests",
    description: "Delete existing pickup requests.",
  },
  {
    key: "importPickupRequests",
    label: "Bulk Import",
    description: "Import pickup requests from CSV/Excel.",
  },
  {
    key: "uploadFiles",
    label: "Upload Files",
    description: "Attach files to pickup requests.",
  },
  {
    key: "manageUsers",
    label: "Manage Users",
    description: "Create and edit users and permissions.",
  },
];

export function resolvePermissions(
  role: Role,
  overrides?: Record<string, unknown> | null
): Permissions {
  const preset = ROLE_PRESETS[role] ?? ROLE_PRESETS.VIEWER;
  if (!overrides) return { ...preset };

  const merged = { ...preset };
  for (const [key, value] of Object.entries(overrides)) {
    if (key in merged) {
      (merged as Record<string, boolean>)[key] = Boolean(value);
    }
  }
  return merged;
}

export function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "EDITOR":
      return "Editor";
    case "VIEWER":
      return "Viewer";
    default:
      return role;
  }
}

export function asPermissionRecord(
  permissions: Permissions
): Record<string, boolean> {
  return permissions as unknown as Record<string, boolean>;
}

export function normalizePermsOverrides(
  value: unknown
): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}