import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines, accounts } from '@/db/schema';
import { eq, and, gte, lte, sum, desc, sql } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

// Analytics API - Financial insights and trends
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const period = searchParams.get('period') || 'last12months'; // 'last12months', 'currentYear', 'custom'

    let startDate, endDate;

    if (period === 'last12months') {
      endDate = new Date();
      startDate = subMonths(endDate, 11);
      startDate = startOfMonth(startDate);
      endDate = endOfMonth(endDate);
    } else if (period === 'currentYear') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      // Custom date range
      startDate = dateFrom ? startOfDay(new Date(dateFrom)) : startOfMonth(subMonths(new Date(), 11));
      endDate = dateTo ? endOfDay(new Date(dateTo)) : endOfMonth(new Date());
    }

    console.log('Generating Analytics for:', {
      period,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });

    // Get all accounts with their types
    const allAccounts = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        code: accounts.code,
        type: accounts.type,
        normalBalance: accounts.normalBalance,
      })
      .from(accounts)
      .where(eq(accounts.isActive, true));

    // Get monthly trend data
    const monthlyData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const monthTransactions = await db
        .select({
          accountType: accounts.type,
          debit: sum(transactionLines.debit),
          credit: sum(transactionLines.credit),
        })
        .from(transactionLines)
        .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
        .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
        .where(and(
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd),
          sql`${transactions.status} IN ('posted', 'approved')`
        ))
        .groupBy(accounts.type);

      const revenue = monthTransactions
        .filter(row => row.accountType === 'revenue')
        .reduce((sum, row) => sum + Number(row.credit || 0), 0);

      const expenses = monthTransactions
        .filter(row => row.accountType === 'expense')
        .reduce((sum, row) => sum + Number(row.debit || 0), 0);

      monthlyData.push({
        month: format(monthStart, 'MMM yyyy'),
        revenue,
        expenses,
        profit: revenue - expenses,
        date: monthStart.toISOString()
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Get expense category breakdown for the entire period
    const expenseByCategory = await db
      .select({
        accountId: transactionLines.accountId,
        accountName: accounts.name,
        accountCode: accounts.code,
        totalDebits: sum(transactionLines.debit),
      })
      .from(transactionLines)
      .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.status} IN ('posted', 'approved')`,
        sql`${accounts.type} = 'expense'`
      ))
      .groupBy(transactionLines.accountId, accounts.name, accounts.code)
      .orderBy(desc(sql`totalDebits`));

    // Get revenue source breakdown
    const revenueBySource = await db
      .select({
        accountId: transactionLines.accountId,
        accountName: accounts.name,
        accountCode: accounts.code,
        totalCredits: sum(transactionLines.credit),
      })
      .from(transactionLines)
      .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.status} IN ('posted', 'approved')`,
        sql`${accounts.type} = 'revenue'`
      ))
      .groupBy(transactionLines.accountId, accounts.name, accounts.code)
      .orderBy(desc(sql`totalCredits`));

    // Calculate key metrics
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Calculate growth rates
    const monthlyGrowthRates = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const currentMonth = monthlyData[i];
      const previousMonth = monthlyData[i - 1];

      if (previousMonth.revenue > 0) {
        const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
        monthlyGrowthRates.push({
          month: currentMonth.month,
          revenueGrowth: revenueGrowth.toFixed(1)
        });
      }
    }

    const averageMonthlyGrowth = monthlyGrowthRates.length > 0
      ? monthlyGrowthRates.reduce((sum, rate) => sum + parseFloat(rate.revenueGrowth), 0) / monthlyGrowthRates.length
      : 0;

    // Cash flow analysis (simplified)
    const cashInflows = totalRevenue;
    const cashOutflows = totalExpenses;
    const netCashFlow = cashInflows - cashOutflows;

    // Calculate previous period data for comparison
    let previousPeriodData = null;
    const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodLength);
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    // Get previous period transactions
    const previousPeriodTransactions = await db
      .select({
        accountType: accounts.type,
        debit: sum(transactionLines.debit),
        credit: sum(transactionLines.credit),
      })
      .from(transactionLines)
      .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, previousStartDate),
        lte(transactions.date, previousEndDate),
        sql`${transactions.status} IN ('posted', 'approved')`
      ))
      .groupBy(accounts.type);

    const previousRevenue = previousPeriodTransactions
      .filter(row => row.accountType === 'revenue')
      .reduce((sum, row) => sum + Number(row.credit || 0), 0);

    const previousExpenses = previousPeriodTransactions
      .filter(row => row.accountType === 'expense')
      .reduce((sum, row) => sum + Number(row.debit || 0), 0);

    const previousProfit = previousRevenue - previousExpenses;
    const previousCashFlow = previousRevenue - previousExpenses;

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expensesChange = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const profitChange = previousProfit > 0 ? ((totalProfit - previousProfit) / Math.abs(previousProfit)) * 100 : 0;
    const cashFlowChange = previousCashFlow > 0 ? ((netCashFlow - previousCashFlow) / Math.abs(previousCashFlow)) * 100 : 0;

    const analytics = {
      period: {
        from: format(startDate, 'yyyy-MM-dd'),
        to: format(endDate, 'yyyy-MM-dd'),
        type: period
      },

      // Key Performance Indicators
      kpis: {
        totalRevenue,
        totalExpenses,
        totalProfit,
        profitMargin: profitMargin.toFixed(2),
        averageMonthlyGrowth: averageMonthlyGrowth.toFixed(2),
        netCashFlow,
        operatingExpenses: totalExpenses,
        grossProfit: totalRevenue,
        expenseRatio: totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(2) : 0
      },

      // Quick stats with comparisons
      quickStats: {
        revenue: {
          value: totalRevenue,
          change: revenueChange.toFixed(1),
          trend: revenueChange >= 0 ? 'up' : 'down'
        },
        expenses: {
          value: totalExpenses,
          change: expensesChange.toFixed(1),
          trend: expensesChange >= 0 ? 'up' : 'down'
        },
        profit: {
          value: totalProfit,
          change: profitChange.toFixed(1),
          trend: profitChange >= 0 ? 'up' : 'down'
        },
        cashFlow: {
          value: netCashFlow,
          change: cashFlowChange.toFixed(1),
          trend: cashFlowChange >= 0 ? 'up' : 'down'
        }
      },

      // Monthly trends
      monthlyTrends: monthlyData,

      // Expense breakdown
      expenseBreakdown: expenseByCategory.map(item => ({
        name: item.accountName,
        code: item.accountCode,
        value: Number(item.totalDebits || 0),
        percentage: totalExpenses > 0 ? ((Number(item.totalDebits || 0) / totalExpenses) * 100).toFixed(2) : 0
      })),

      // Revenue sources
      revenueSources: revenueBySource.map(item => ({
        name: item.accountName,
        code: item.accountCode,
        value: Number(item.totalCredits || 0),
        percentage: totalRevenue > 0 ? ((Number(item.totalCredits || 0) / totalRevenue) * 100).toFixed(2) : 0
      })),

      // Growth metrics
      growthMetrics: {
        monthlyGrowthRates,
        averageGrowthRate: averageMonthlyGrowth.toFixed(2),
        totalMonths: monthlyData.length
      },

      // Previous period data for comparison
      previousPeriod: {
        from: format(previousStartDate, 'yyyy-MM-dd'),
        to: format(previousEndDate, 'yyyy-MM-dd'),
        revenue: previousRevenue,
        expenses: previousExpenses,
        profit: previousProfit,
        cashFlow: previousCashFlow
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics', details: error.message },
      { status: 500 }
    );
  }
}