import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines, accounts } from '@/db/schema';
import { eq, and, gte, lte, sum, desc, sql } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// GET /api/reports - Financial summary and chart data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Set default date range to last 6 months if not provided
    const defaultDateFrom = subMonths(new Date(), 6);
    const defaultDateTo = new Date();

    const startDate = dateFrom ? new Date(dateFrom) : defaultDateFrom;
    const endDate = dateTo ? new Date(dateTo) : defaultDateTo;

    // Get all transactions with account details
    const transactionData = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        status: transactions.status,
        accountName: accounts.name,
        accountType: accounts.type,
        accountCode: accounts.code,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactions)
      .leftJoin(transactionLines, eq(transactions.id, transactionLines.transactionId))
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.status, 'approved') // Only include approved transactions
      ))
      .orderBy(desc(transactions.date));

    // Calculate key metrics
    const totalRevenue = transactionData
      .filter(t => t.accountType === 'revenue')
      .reduce((sum, t) => sum + t.credit, 0);

    const totalExpenses = transactionData
      .filter(t => t.accountType === 'expense')
      .reduce((sum, t) => sum + t.debit, 0);

    const totalAssets = transactionData
      .filter(t => t.accountType === 'asset')
      .reduce((sum, t) => sum + t.debit - t.credit, 0);

    const totalLiabilities = transactionData
      .filter(t => t.accountType === 'liability')
      .reduce((sum, t) => sum + t.credit - t.debit, 0);

    const netProfit = totalRevenue - totalExpenses;
    const equity = totalAssets - totalLiabilities;

    // Monthly revenue vs expenses data for line chart
    const monthlyData = [];
    const currentMonth = startOfMonth(endDate);

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(currentMonth, i));
      const monthEnd = endOfMonth(subMonths(currentMonth, i));

      const monthTransactions = transactionData.filter(t =>
        t.date >= monthStart && t.date <= monthEnd
      );

      const monthRevenue = monthTransactions
        .filter(t => t.accountType === 'revenue')
        .reduce((sum, t) => sum + t.credit, 0);

      const monthExpenses = monthTransactions
        .filter(t => t.accountType === 'expense')
        .reduce((sum, t) => sum + t.debit, 0);

      monthlyData.push({
        month: format(monthStart, 'MMM yyyy'),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      });
    }

    // Account balance breakdown for pie chart - simplified approach
    const accountBalanceData = await db
      .select({
        name: accounts.name,
        type: accounts.type,
        debit: sum(transactionLines.debit),
        credit: sum(transactionLines.credit),
      })
      .from(accounts)
      .leftJoin(transactionLines, eq(accounts.id, transactionLines.accountId))
      .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        eq(transactions.status, 'approved')
      ))
      .groupBy(accounts.id, accounts.name, accounts.type);

    const accountBalances = accountBalanceData
      .map(account => ({
        name: account.name,
        type: account.type,
        balance: Number(account.debit || 0) - Number(account.credit || 0),
      }))
      .filter(account => Math.abs(account.balance) > 0.01);

    // Cash flow data for area chart
    const cashFlowData = monthlyData.map(month => ({
      month: month.month,
      inflow: month.revenue,
      outflow: month.expenses,
      netCash: month.revenue - month.expenses,
    }));

    // Top expense categories for bar chart
    const expenseCategories = transactionData
      .filter(t => t.accountType === 'expense')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.category === t.accountName);
        if (existing) {
          existing.amount += t.debit;
        } else {
          acc.push({
            category: t.accountName,
            amount: t.debit,
          });
        }
        return acc;
      }, [] as { category: string; amount: number }[])
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 expense categories

    const response = {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalAssets,
        totalLiabilities,
        equity,
        totalTransactions: transactionData.length,
      },
      charts: {
        monthlyTrend: monthlyData,
        accountBalances: accountBalances.map(acc => ({
          name: acc.name,
          type: acc.type,
          value: Math.abs(Number(acc.balance)),
          category: acc.type,
        })),
        cashFlow: cashFlowData,
        topExpenses: expenseCategories,
      },
      period: {
        from: format(startDate, 'yyyy-MM-dd'),
        to: format(endDate, 'yyyy-MM-dd'),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}