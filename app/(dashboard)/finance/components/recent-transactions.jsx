"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { getFinanceTransactions } from "@/actions/finance";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: [
      "transactions",
      {
        page: 1,
        limit: 5,
        type: null,
        startDate: null,
        endDate: null,
        refType: null,
        refId: null,
      },
    ],
    queryFn: () =>
      getFinanceTransactions({
        page: 1,
        limit: 5,
        type: null,
        startDate: null,
        endDate: null,
        refType: null,
        refId: null,
      }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-center space-x-4 p-3 border rounded"
          >
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const transactionList = transactions?.data || [];

  if (transactionList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No transactions found</p>
        <Link href="/finance/transactions">
          <Button className="mt-4">Add First Transaction</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {transactionList.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-4">
              <Badge
                variant={
                  transaction.type === "income" ? "default" : "destructive"
                }
                className={
                  transaction.type === "income"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {transaction.type}
              </Badge>
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(transaction.date)} •{" "}
                  {transaction.category || "No category"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatPrice(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Link href="/finance/transactions">
          <Button variant="outline" className="bg-white text-black">
            View All Transactions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
