import requirePageAccess from "@/lib/requirePageAccess";
import { TransactionsPage } from "./transactions-page"

export default async function Transactions() {
  await requirePageAccess({
    finances: ["read"],
  });
  return <TransactionsPage />
}
