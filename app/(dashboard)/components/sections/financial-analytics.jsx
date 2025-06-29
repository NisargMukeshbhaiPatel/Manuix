"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { useState, useMemo } from "react";
import {
  useFinanceTransactions,
  useFinanceSummary,
} from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/skeleton";
import { Pie, Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 3,
  plugins: {
    legend: {
      position: "top",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 3,
  plugins: {
    legend: {
      position: "right",
    },
  },
};

export function FinancialAnalytics() {
  const [timePeriod, setTimePeriod] = useState("week");

  const { data: transactions, isLoading: transactionsLoading } =
    useFinanceTransactions({ limit: 1000 });
  const { data: financeSummary, isLoading: summaryLoading } =
    useFinanceSummary();

  const getDateGroupKey = (date, period) => {
    const d = new Date(date);
    switch (period) {
      case "week":
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        return `Week of ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      case "month":
      default:
        return d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
    }
  };

  const getDateRange = (period) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7 * 12);
        break;
      case "month":
      default:
        startDate.setMonth(now.getMonth() - 12);
        break;
    }

    return { startDate, endDate: now };
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions?.data) return [];

    const { startDate } = getDateRange(timePeriod);
    return transactions.data.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate;
    });
  }, [transactions, timePeriod]);

  // Revenue vs Expenses Trend
  const monthlyChartData = useMemo(() => {
    if (!filteredTransactions.length) return { labels: [], datasets: [] };

    const periodMap = new Map();
    filteredTransactions.forEach((transaction) => {
      const periodKey = getDateGroupKey(transaction.date, timePeriod);
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          period: periodKey,
          revenue: 0,
          expenses: 0,
        });
      }
      const data = periodMap.get(periodKey);
      if (transaction.type === "income") {
        data.revenue += Number(transaction.amount);
      } else {
        data.expenses += Number(transaction.amount);
      }
    });

    const sortedData = Array.from(periodMap.values()).sort((a, b) => {
      return new Date(a.period) - new Date(b.period);
    });

    const limitedData = sortedData.slice(-(timePeriod === "week" ? 12 : 12));

    return {
      labels: limitedData.map((item) => item.period),
      datasets: [
        {
          label: "Revenue",
          data: limitedData.map((item) => item.revenue),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          tension: 0.1,
        },
        {
          label: "Expenses",
          data: limitedData.map((item) => item.expenses),
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.2)",
          tension: 0.1,
        },
      ],
    };
  }, [filteredTransactions, timePeriod]);

  // Top Expense Categories
  const expenseCategoriesData = useMemo(() => {
    if (!filteredTransactions.length) return { labels: [], datasets: [] };

    const categoryMap = new Map();
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category || "Other";
        categoryMap.set(
          category,
          (categoryMap.get(category) || 0) + Number(transaction.amount),
        );
      });

    const sortedCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sortedCategories.map(([name]) => name),
      datasets: [
        {
          label: "Amount ($)",
          data: sortedCategories.map(([, value]) => value),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
            "rgb(139, 92, 246)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTransactions]);

  // Top Customers by Revenue
  const topCustomersData = useMemo(() => {
    if (!filteredTransactions.length) return { labels: [], datasets: [] };

    const customerMap = new Map();
    filteredTransactions
      .filter((t) => t.type === "income" && t.source?.customer_name)
      .forEach((transaction) => {
        const customer = transaction.source.customer_name;
        customerMap.set(
          customer,
          (customerMap.get(customer) || 0) + Number(transaction.amount),
        );
      });

    const sortedCustomers = Array.from(customerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      labels: sortedCustomers.map(([name]) => name),
      datasets: [
        {
          label: "Revenue ($)",
          data: sortedCustomers.map(([, value]) => value),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTransactions]);

  // Transaction Volume Analysis
  const transactionVolumeData = useMemo(() => {
    if (!filteredTransactions.length) return { labels: [], datasets: [] };

    const volumeRanges = {
      "Under $100": 0,
      "$100 - $500": 0,
      "$500 - $1,000": 0,
      "$1,000 - $5,000": 0,
      "$5,000+": 0,
    };

    filteredTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      if (amount < 100) volumeRanges["Under $100"]++;
      else if (amount < 500) volumeRanges["$100 - $500"]++;
      else if (amount < 1000) volumeRanges["$500 - $1,000"]++;
      else if (amount < 5000) volumeRanges["$1,000 - $5,000"]++;
      else volumeRanges["$5,000+"]++;
    });

    return {
      labels: Object.keys(volumeRanges),
      datasets: [
        {
          data: Object.values(volumeRanges),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(147, 51, 234, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
            "rgb(147, 51, 234)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredTransactions]);

  const paymentStatusData = useMemo(() => {
    return {
      labels: ["Paid", "Unpaid", "Partial"],
      datasets: [
        {
          data: [65, 25, 10],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(245, 158, 11, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(239, 68, 68)",
            "rgb(245, 158, 11)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, []);

  // Cash Flow Analysis (Running Balance)
  const cashFlowData = useMemo(() => {
    if (!filteredTransactions.length) return { labels: [], datasets: [] };

    // Sort transactions by date
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    let runningBalance = 0;
    const cashFlowPoints = [];

    sortedTransactions.forEach((transaction) => {
      if (transaction.type === "income") {
        runningBalance += Number(transaction.amount);
      } else {
        runningBalance -= Number(transaction.amount);
      }

      cashFlowPoints.push({
        date: getDateGroupKey(transaction.date, timePeriod),
        balance: runningBalance,
      });
    });

    // Group by period and take the last balance for each period
    const periodBalances = new Map();
    cashFlowPoints.forEach((point) => {
      periodBalances.set(point.date, point.balance);
    });

    const sortedPeriods = Array.from(periodBalances.entries())
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-(timePeriod === "week" ? 12 : 12));

    return {
      labels: sortedPeriods.map(([date]) => date),
      datasets: [
        {
          label: "Cash Flow ($)",
          data: sortedPeriods.map(([, balance]) => balance),
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "rgba(168, 85, 247, 0.2)",
          tension: 0.1,
          fill: true,
        },
      ],
    };
  }, [filteredTransactions, timePeriod]);

  const getPeriodDisplayText = () => {
    switch (timePeriod) {
      case "week":
        return "Weekly view over the last 12 weeks";
      case "month":
      default:
        return "Monthly view over the last 12 months";
    }
  };

  return (
    <div className="space-y-4">
      {/* Time Period Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Period:</span>
        <div className="flex rounded-lg border">
          {[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimePeriod(option.value)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                timePeriod === option.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              } ${option.value === "week" ? "rounded-l-md" : "rounded-r-md"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue vs Expenses Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Revenue vs Expenses Trend</CardTitle>
            <CardDescription>{getPeriodDisplayText()}</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Analysis */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>
              Displays the running cash balance over time by adding incomes and
              subtracting expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <Line data={cashFlowData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
            <CardDescription>Highest spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <Bar
                  data={expenseCategoriesData}
                  options={{
                    ...chartOptions,
                    indexAxis: "y",
                    scales: {
                      x: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
            <CardDescription>Sales order payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Doughnut data={paymentStatusData} options={pieOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>
              Number of transactions by amount range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <Pie data={transactionVolumeData} options={pieOptions} />
              </div>
            )}
          </CardContent>
        </Card>
        {/* Top Customers by Revenue */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
            <CardDescription>
              Highest revenue generating customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <div className="h-[250px]">
                <Bar
                  data={topCustomersData}
                  options={{
                    ...chartOptions,
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
