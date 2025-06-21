import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ROLE_PERMISSIONS, roles } from "@/constants/rbac";

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
