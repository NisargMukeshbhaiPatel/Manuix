import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const roles = [
  "user",
  "admin",
  "production",
  "procurement",
  "sales",
  "finance",
];

const CRUD = ["create", "read", "update", "delete"];
export const ROLE_PERMISSIONS = {
  admin: {
    products: CRUD,
    boms: CRUD,
    inventories: CRUD,
    purchaseorders: CRUD,
    salesorders: CRUD,
    rawmaterials: CRUD,
    finances: CRUD,
    users: CRUD,
    notifications: CRUD,
  },
  user: {
    products: ["read"],
    boms: [],
    inventories: [],
    purchaseorders: [],
    salesorders: [],
    rawmaterials: [],
    finances: [],
    users: [],
    notifications: ["read"],
  },
  production: {
    products: ["read"],
    boms: CRUD,
    inventories: ["read", "update"],
    purchaseorders: ["read"],
    salesorders: ["read"],
    rawmaterials: ["read"],
    finances: [],
    users: ["read"],
    notifications: ["read", "create"],
  },
  procurement: {
    products: ["read"],
    boms: ["read"],
    inventories: ["read"],
    purchaseorders: CRUD,
    salesorders: ["read"],
    rawmaterials: CRUD,
    finances: ["read"],
    users: ["read"],
    notifications: ["read", "create"],
  },
  sales: {
    products: ["read", "update"],
    boms: ["read"],
    inventories: ["read"],
    purchaseorders: ["read"],
    salesorders: CRUD,
    rawmaterials: ["read"],
    finances: ["read"],
    users: ["read"],
    notifications: ["read", "create"],
  },
  finance: {
    products: ["read"],
    boms: ["read"],
    inventories: ["read"],
    purchaseorders: ["read", "update"],
    salesorders: ["read", "update"],
    rawmaterials: ["read"],
    finances: CRUD,
    users: ["read"],
    notifications: ["read", "create"],
  },
};

export function canAccess(role, collection, action) {
  return ROLE_PERMISSIONS[role]?.[collection]?.includes(action) || false;
}

// For actions
export function createCollectionRBAC(collection) {
  const requireAccess = async (action) => {
    const { user } = await getServerSession(authOptions);
    console.log(collection, action, canAccess(user.role, collection, action));
    if (!canAccess(user?.role, collection, action)) {
      throw new Error(
        `Access denied: ${user?.role} cannot ${action} ${collection}`,
      );
    }
  };

  const withAccess = (action, fn) => {
    return async (...args) => {
      try {
        await requireAccess(action);
      } catch (error) {
        throw error;
      }
      return fn(...args);
    };
  };
  //maybe also
  //const withMultiAccess = (requirements, fn) {

  return {
    withCreate: (fn) => withAccess("create", fn),
    withRead: (fn) => withAccess("read", fn),
    withUpdate: (fn) => withAccess("update", fn),
    withDelete: (fn) => withAccess("delete", fn),
  };
}

// For UI rbac
export function createServerPermissions(role) {
  return {
    // canAccess: (collection, action) => canAccess(role, collection, action),
    canRead: (collection) => canAccess(role, collection, "read"),
    canWrite: (collection) => canAccess(role, collection, "create"),
    canEdit: (collection) => canAccess(role, collection, "update"),
    canDelete: (collection) => canAccess(role, collection, "delete"),
  };
}
