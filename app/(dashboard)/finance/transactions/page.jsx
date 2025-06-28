import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";
import { TransactionsPage } from "./transactions-page"

export default async function Transactions() {
  await requirePageAccess({
    finances: ["read"],
  });
  
  const perms = await createServerPermissionsFromCollection("finances");
  
  return <TransactionsPage perms={perms} />
}
