import { DashboardSummary } from "./components/dashboard-summary";
import { RecentTransactions } from "./components/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";

export default async function FinancePage() {
  await requirePageAccess({
    finances: ["read"],
  });

  const perms = await createServerPermissionsFromCollection("finances");

  return (
    <div className="space-y-6">
      <DashboardSummary perms={perms} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions perms={perms} />
        </CardContent>
      </Card>
    </div>
  );
}
