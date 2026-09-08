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
  viewDataWiping: boolean;
  createDataWiping: boolean;
  editDataWiping: boolean;
  deleteDataWiping: boolean;
  importDataWiping: boolean;
  viewCertificate: boolean;
  createCertificate: boolean;
  editCertificate: boolean;
  deleteCertificate: boolean;
  importCertificate: boolean;
  viewGrn: boolean;
  createGrn: boolean;
  editGrn: boolean;
  deleteGrn: boolean;
  importGrn: boolean;
  viewConsolidated: boolean;
  createConsolidated: boolean;
  editConsolidated: boolean;
  deleteConsolidated: boolean;
  importConsolidated: boolean;
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
    viewDataWiping: false,
    createDataWiping: false,
    editDataWiping: false,
    deleteDataWiping: false,
    importDataWiping: false,
    viewCertificate: false,
    createCertificate: false,
    editCertificate: false,
    deleteCertificate: false,
    importCertificate: false,
    viewGrn: false,
    createGrn: false,
    editGrn: false,
    deleteGrn: false,
    importGrn: false,
    viewConsolidated: false,
    createConsolidated: false,
    editConsolidated: false,
    deleteConsolidated: false,
    importConsolidated: false,
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
    viewDataWiping: true,
    createDataWiping: true,
    editDataWiping: true,
    deleteDataWiping: true,
    importDataWiping: true,
    viewCertificate: true,
    createCertificate: true,
    editCertificate: true,
    deleteCertificate: true,
    importCertificate: true,
    viewGrn: true,
    createGrn: true,
    editGrn: true,
    deleteGrn: true,
    importGrn: true,
    viewConsolidated: true,
    createConsolidated: true,
    editConsolidated: true,
    deleteConsolidated: true,
    importConsolidated: true,
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
    viewDataWiping: true,
    createDataWiping: true,
    editDataWiping: true,
    deleteDataWiping: false,
    importDataWiping: true,
    viewCertificate: true,
    createCertificate: true,
    editCertificate: true,
    deleteCertificate: false,
    importCertificate: true,
    viewGrn: true,
    createGrn: true,
    editGrn: true,
    deleteGrn: false,
    importGrn: true,
    viewConsolidated: true,
    createConsolidated: true,
    editConsolidated: true,
    deleteConsolidated: false,
    importConsolidated: true,
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
    viewDataWiping: true,
    createDataWiping: false,
    editDataWiping: false,
    deleteDataWiping: false,
    importDataWiping: false,
    viewCertificate: true,
    createCertificate: false,
    editCertificate: false,
    deleteCertificate: false,
    importCertificate: false,
    viewGrn: true,
    createGrn: false,
    editGrn: false,
    deleteGrn: false,
    importGrn: false,
    viewConsolidated: true,
    createConsolidated: false,
    editConsolidated: false,
    deleteConsolidated: false,
    importConsolidated: false,
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
    key: "viewDataWiping",
    label: "View Data Wiping",
    description: "See the data wiping page and data.",
  },
  {
    key: "createDataWiping",
    label: "Create Data Wiping",
    description: "Create new data wiping records.",
  },
  {
    key: "editDataWiping",
    label: "Edit Data Wiping",
    description: "Edit existing data wiping records.",
  },
  {
    key: "deleteDataWiping",
    label: "Delete Data Wiping",
    description: "Delete existing data wiping records.",
  },
  {
    key: "importDataWiping",
    label: "Bulk Import Data Wiping",
    description: "Import data wiping records from CSV/Excel.",
  },
  {
    key: "viewCertificate",
    label: "View Certificates",
    description: "See the certificates page and data.",
  },
  {
    key: "createCertificate",
    label: "Create Certificates",
    description: "Create new certificate records.",
  },
  {
    key: "editCertificate",
    label: "Edit Certificates",
    description: "Edit existing certificate records.",
  },
  {
    key: "deleteCertificate",
    label: "Delete Certificates",
    description: "Delete existing certificate records.",
  },
  {
    key: "importCertificate",
    label: "Bulk Import Certificates",
    description: "Import certificates from CSV/Excel.",
  },
  {
    key: "viewGrn",
    label: "View GRN",
    description: "See the GRN page and data.",
  },
  {
    key: "createGrn",
    label: "Create GRN",
    description: "Create new GRN records.",
  },
  {
    key: "editGrn",
    label: "Edit GRN",
    description: "Edit existing GRN records.",
  },
  {
    key: "deleteGrn",
    label: "Delete GRN",
    description: "Delete existing GRN records.",
  },
  {
    key: "importGrn",
    label: "Bulk Import GRN",
    description: "Import GRN records from CSV/Excel.",
  },
  {
    key: "viewConsolidated",
    label: "View Consolidated",
    description: "See the consolidated page and data.",
  },
  {
    key: "createConsolidated",
    label: "Create Consolidated",
    description: "Create new consolidated records.",
  },
  {
    key: "editConsolidated",
    label: "Edit Consolidated",
    description: "Edit existing consolidated records.",
  },
  {
    key: "deleteConsolidated",
    label: "Delete Consolidated",
    description: "Delete existing consolidated records.",
  },
  {
    key: "importConsolidated",
    label: "Bulk Import Consolidated",
    description: "Import consolidated records from CSV/Excel.",
  },
  {
    key: "uploadFiles",
    label: "Upload Files",
    description: "Attach files (PDF, JPG/PNG) to quotes, purchase orders, payments and pickup requests.",
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