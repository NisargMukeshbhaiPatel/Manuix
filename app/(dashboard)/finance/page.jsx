import { DashboardSummary } from "./components/dashboard-summary";
import { RecentTransactions } from "./components/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function FinancePage() {
  await requirePageAccess({
    finances: ["read"],
  });

  return (
    <div className="space-y-6">
      <DashboardSummary />

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions />
        </CardContent>
      </Card>
    </div>
  );
}
