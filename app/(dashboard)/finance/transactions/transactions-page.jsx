"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/button";
import { CardTitle } from "@/components/card";
import { useRouter } from "next/navigation";
import { TransactionFiltersComponent } from "./components/transaction-filters";
import { TransactionTable } from "./components/transaction-table";
import { TransactionModal } from "./components/transaction-modal";
import { getFinanceTransactions } from "@/actions/finance";
import { Plus, ArrowLeft } from "lucide-react";

export function TransactionsPage({ perms }) {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: null,
    startDate: null,
    endDate: null,
    refType: null,
    refId: null,
  });
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getFinanceTransactions(filters),
  });
  console.log("filters", transactions);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/finance")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Transactions</h1>
          </div>
        </div>
        {perms?.canWrite && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <CardTitle>Filters</CardTitle>
        <TransactionFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      <div className="space-y-4">
        <CardTitle>
          All Transactions
          {transactions?.pagination && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({transactions.pagination.total} total)
            </span>
          )}
        </CardTitle>
        <TransactionTable
          transactions={transactions?.data || []}
          pagination={transactions?.pagination}
          isLoading={isLoading}
          onEdit={perms?.canEdit ? handleEdit : undefined}
          onPageChange={(page) => setFilters({ ...filters, page })}
          perms={perms}
        />
      </div>

      {perms?.canWrite && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          transaction={editingTransaction}
        />
      )}
    </div>
  );
}
