import { getAllUsers } from "@/actions/user";
import AdminUserManagement from "./admin-user-management";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function UserManagementPage() {
  await requirePageAccess({
    users: ["create", "read", "update", "delete"],
  });

  let allUsers = [];
  try {
    const res = await getAllUsers();
    if (!res.success) throw new Error(res.error);
    allUsers = res.users;
    console.log(allUsers);
  } catch (error) {
    return error.message;
  }

  return (
    <>
      <AdminUserManagement allUsers={allUsers} />
    </>
  );
}
