export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export interface Permissions {
  viewPickupRequests: boolean;
  createPickupRequest: boolean;
  editPickupRequest: boolean;
  deletePickupRequest: boolean;
  importPickupRequests: boolean;
  viewQuotes: boolean;
  createQuote: boolean;
  editQuote: boolean;
  deleteQuote: boolean;
  importQuotes: boolean;
  viewPurchaseOrders: boolean;
  createPurchaseOrder: boolean;
  editPurchaseOrder: boolean;
  deletePurchaseOrder: boolean;
  importPurchaseOrders: boolean;
  viewPayments: boolean;
  createPayment: boolean;
  editPayment: boolean;
  deletePayment: boolean;
  importPayments: boolean;
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
    viewQuotes: false,
    createQuote: false,
    editQuote: false,
    deleteQuote: false,
    importQuotes: false,
    viewPurchaseOrders: false,
    createPurchaseOrder: false,
    editPurchaseOrder: false,
    deletePurchaseOrder: false,
    importPurchaseOrders: false,
    viewPayments: false,
    createPayment: false,
    editPayment: false,
    deletePayment: false,
    importPayments: false,
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
    viewQuotes: true,
    createQuote: true,
    editQuote: true,
    deleteQuote: true,
    importQuotes: true,
    viewPurchaseOrders: true,
    createPurchaseOrder: true,
    editPurchaseOrder: true,
    deletePurchaseOrder: true,
    importPurchaseOrders: true,
    viewPayments: true,
    createPayment: true,
    editPayment: true,
    deletePayment: true,
    importPayments: true,
    uploadFiles: true,
    manageUsers: true,
  },
  EDITOR: {
    viewPickupRequests: true,
    createPickupRequest: true,
    editPickupRequest: true,
    deletePickupRequest: false,
    importPickupRequests: true,
    viewQuotes: true,
    createQuote: true,
    editQuote: true,
    deleteQuote: false,
    importQuotes: true,
    viewPurchaseOrders: true,
    createPurchaseOrder: true,
    editPurchaseOrder: true,
    deletePurchaseOrder: false,
    importPurchaseOrders: true,
    viewPayments: true,
    createPayment: true,
    editPayment: true,
    deletePayment: false,
    importPayments: true,
    uploadFiles: true,
    manageUsers: false,
  },
  VIEWER: {
    viewPickupRequests: true,
    createPickupRequest: false,
    editPickupRequest: false,
    deletePickupRequest: false,
    importPickupRequests: false,
    viewQuotes: true,
    createQuote: false,
    editQuote: false,
    deleteQuote: false,
    importQuotes: false,
    viewPurchaseOrders: true,
    createPurchaseOrder: false,
    editPurchaseOrder: false,
    deletePurchaseOrder: false,
    importPurchaseOrders: false,
    viewPayments: true,
    createPayment: false,
    editPayment: false,
    deletePayment: false,
    importPayments: false,
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
    label: "Bulk Import Pickup Requests",
    description: "Import pickup requests from CSV/Excel.",
  },
  {
    key: "viewQuotes",
    label: "View Quotes",
    description: "See the quotes page and data.",
  },
  {
    key: "createQuote",
    label: "Create Quotes",
    description: "Create new quote records.",
  },
  {
    key: "editQuote",
    label: "Edit Quotes",
    description: "Edit existing quotes.",
  },
  {
    key: "deleteQuote",
    label: "Delete Quotes",
    description: "Delete existing quotes.",
  },
  {
    key: "importQuotes",
    label: "Bulk Import Quotes",
    description: "Import quotes from CSV/Excel.",
  },
  {
    key: "viewPurchaseOrders",
    label: "View Purchase Orders",
    description: "See the purchase orders page and data.",
  },
  {
    key: "createPurchaseOrder",
    label: "Create Purchase Orders",
    description: "Create new purchase order records.",
  },
  {
    key: "editPurchaseOrder",
    label: "Edit Purchase Orders",
    description: "Edit existing purchase orders.",
  },
  {
    key: "deletePurchaseOrder",
    label: "Delete Purchase Orders",
    description: "Delete existing purchase orders.",
  },
  {
    key: "importPurchaseOrders",
    label: "Bulk Import Purchase Orders",
    description: "Import purchase orders from CSV/Excel.",
  },
  {
    key: "viewPayments",
    label: "View Payments",
    description: "See the payments page and data.",
  },
  {
    key: "createPayment",
    label: "Create Payments",
    description: "Create new payment records.",
  },
  {
    key: "editPayment",
    label: "Edit Payments",
    description: "Edit existing payments.",
  },
  {
    key: "deletePayment",
    label: "Delete Payments",
    description: "Delete existing payments.",
  },
  {
    key: "importPayments",
    label: "Bulk Import Payments",
    description: "Import payments from CSV/Excel.",
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