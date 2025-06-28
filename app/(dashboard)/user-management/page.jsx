import { getAllUsers } from "@/actions/user";
import AdminUserManagement from "./admin-user-management";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";

export default async function UserManagementPage() {
  await requirePageAccess({
    users: ["read"],
  });

  let allUsers = [];
  try {
    const res = await getAllUsers();
    if (!res.success) throw new Error(res.error);
    allUsers = res.users;
  } catch (error) {
    return error.message;
  }

  const perms = await createServerPermissionsFromCollection("users");
  return (
    <>
      <AdminUserManagement perms={perms} allUsers={allUsers} />
    </>
  );
}
