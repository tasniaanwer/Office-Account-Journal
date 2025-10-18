import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines, accounts } from '@/db/schema';
import { eq, and, gte, lte, sum, desc, sql } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from 'date-fns';

// Income Statement API - Revenue - Expenses = Net Income
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const period = searchParams.get('period') || 'custom'; // 'month', 'quarter', 'year', 'custom'

    let startDate, endDate;

    if (period === 'current-month') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else if (period === 'current-quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    } else if (period === 'current-year') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
      endDate = new Date(new Date().getFullYear(), 11, 31);
    } else {
      // Custom date range
      startDate = dateFrom ? startOfDay(new Date(dateFrom)) : startOfMonth(new Date());
      endDate = dateTo ? endOfDay(new Date(dateTo)) : endOfMonth(new Date());
    }

    console.log('Generating Income Statement for:', {
      period,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });

    // Get revenue and expense accounts
    const pnlAccounts = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.isActive, true),
        sql`${accounts.type} IN ('revenue', 'expense')`
      ))
      .orderBy(accounts.code);

    // Get transaction data for P&L accounts
    const transactionData = await db
      .select({
        accountId: transactionLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountType: accounts.type,
        accountNormalBalance: accounts.normalBalance,
        debit: sum(transactionLines.debit),
        credit: sum(transactionLines.credit),
        transactionCount: sql<number>`count(*)`.mapWith(Number),
        firstTransactionDate: sql<string>`min(${transactions.date})`,
        lastTransactionDate: sql<string>`max(${transactions.date})`,
      })
      .from(transactionLines)
      .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .innerJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.status} IN ('posted', 'approved')`,
        sql`${accounts.type} IN ('revenue', 'expense')`,
        eq(accounts.isActive, true)
      ))
      .groupBy(transactionLines.accountId, accounts.code, accounts.name, accounts.type, accounts.normalBalance)
      .orderBy(accounts.code);

    // Process account balances
    const accountBalances = new Map();

    // Initialize P&L accounts
    pnlAccounts.forEach(account => {
      accountBalances.set(account.id, {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        debit: 0,
        credit: 0,
        balance: 0,
        transactionCount: 0,
        activity: []
      });
    });

    // Process transaction data
    transactionData.forEach(row => {
      if (!row.accountId) return;

      const account = accountBalances.get(row.accountId);
      if (!account) return;

      account.debit = Number(row.debit || 0);
      account.credit = Number(row.credit || 0);
      account.transactionCount = Number(row.transactionCount || 0);

      // Calculate balance based on normal balance
      if (account.normalBalance === 'debit') {
        account.balance = account.debit - account.credit;
      } else {
        account.balance = account.credit - account.debit;
      }
    });

    // Separate revenue and expenses - include all accounts even with zero balances for completeness
    const revenues = Array.from(accountBalances.values())
      .filter(acc => acc.type === 'revenue')
      .sort((a, b) => b.balance - a.balance);

    const expenses = Array.from(accountBalances.values())
      .filter(acc => acc.type === 'expense')
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    // Calculate totals
    const totalRevenue = revenues.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const grossProfit = totalRevenue;
    const operatingIncome = grossProfit - totalExpenses;
    const netIncome = operatingIncome;

    // Group revenues by category
    const serviceRevenue = revenues.filter(acc => ['4010', '4020', '4030'].includes(acc.code));
    const productRevenue = revenues.filter(acc => ['4110', '4120'].includes(acc.code));
    const otherRevenue = revenues.filter(acc => ['4210', '4220'].includes(acc.code));

    // Group expenses by category
    const operatingExpenses = expenses.filter(acc =>
      ['5010', '5020', '5030', '5040', '5110', '5120', '5130', '5140', '5410', '5420', '5430'].includes(acc.code)
    );
    const salesMarketingExpenses = expenses.filter(acc =>
      ['5210', '5220', '5230'].includes(acc.code)
    );
    const administrativeExpenses = expenses.filter(acc =>
      ['5310', '5320', '5330', '5610', '5620', '5710', '5720', '5730'].includes(acc.code)
    );
    const travelExpenses = expenses.filter(acc =>
      ['5510', '5520', '5530'].includes(acc.code)
    );

    // Calculate margins and percentages
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const operatingMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    // Monthly trend comparison (if we have enough data)
    const monthlyTrend = [];
    if (period !== 'current-month') {
      // Calculate monthly breakdown for the period
      const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      if (monthsDiff > 1) {
        const currentMonth = new Date();
        for (let i = Math.min(monthsDiff - 1, 11); i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(currentMonth, i));
          const monthEnd = endOfMonth(subMonths(currentMonth, i));

          // Skip if outside our date range
          if (monthEnd < startDate || monthStart > endDate) continue;

          const monthTransactionData = await db
            .select({
              accountType: accounts.type,
              debit: sum(transactionLines.debit),
              credit: sum(transactionLines.credit),
            })
            .from(transactionLines)
            .innerJoin(transactions, eq(transactionLines.transactionId, transactions.id))
            .innerJoin(accounts, eq(transactionLines.accountId, accounts.id))
            .where(and(
              gte(transactions.date, monthStart),
              lte(transactions.date, monthEnd),
              sql`${transactions.status} IN ('posted', 'approved')`,
              sql`${accounts.type} IN ('revenue', 'expense')`,
              eq(accounts.isActive, true)
            ))
            .groupBy(accounts.type);

          const monthRevenue = monthTransactionData
            .filter(row => row.accountType === 'revenue')
            .reduce((sum, row) => sum + Number(row.credit || 0), 0);

          const monthExpenses = monthTransactionData
            .filter(row => row.accountType === 'expense')
            .reduce((sum, row) => sum + Number(row.debit || 0), 0);

          monthlyTrend.push({
            month: format(monthStart, 'MMM yyyy'),
            revenue: monthRevenue,
            expenses: monthExpenses,
            profit: monthRevenue - monthExpenses
          });
        }
      }
    }

    const incomeStatement = {
      metadata: {
        reportType: 'Income Statement',
        period: {
          from: format(startDate, 'yyyy-MM-dd'),
          to: format(endDate, 'yyyy-MM-dd'),
          type: period
        },
        generatedAt: new Date().toISOString(),
        currency: 'USD'
      },

      revenues: {
        total: totalRevenue,
        categories: {
          services: {
            total: serviceRevenue.reduce((sum, acc) => sum + acc.balance, 0),
            accounts: serviceRevenue.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: acc.balance,
              percentage: totalRevenue > 0 ? (acc.balance / totalRevenue) * 100 : 0
            }))
          },
          products: {
            total: productRevenue.reduce((sum, acc) => sum + acc.balance, 0),
            accounts: productRevenue.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: acc.balance,
              percentage: totalRevenue > 0 ? (acc.balance / totalRevenue) * 100 : 0
            }))
          },
          other: {
            total: otherRevenue.reduce((sum, acc) => sum + acc.balance, 0),
            accounts: otherRevenue.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: acc.balance,
              percentage: totalRevenue > 0 ? (acc.balance / totalRevenue) * 100 : 0
            }))
          }
        },
        detail: revenues.map(acc => ({
          code: acc.code,
          name: acc.name,
          amount: acc.balance,
          percentage: totalRevenue > 0 ? (acc.balance / totalRevenue) * 100 : 0,
          transactionCount: acc.transactionCount
        }))
      },

      expenses: {
        total: totalExpenses,
        categories: {
          operating: {
            total: operatingExpenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
            accounts: operatingExpenses.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: Math.abs(acc.balance),
              percentage: totalExpenses > 0 ? (Math.abs(acc.balance) / totalExpenses) * 100 : 0
            }))
          },
          salesMarketing: {
            total: salesMarketingExpenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
            accounts: salesMarketingExpenses.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: Math.abs(acc.balance),
              percentage: totalExpenses > 0 ? (Math.abs(acc.balance) / totalExpenses) * 100 : 0
            }))
          },
          administrative: {
            total: administrativeExpenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
            accounts: administrativeExpenses.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: Math.abs(acc.balance),
              percentage: totalExpenses > 0 ? (Math.abs(acc.balance) / totalExpenses) * 100 : 0
            }))
          },
          travel: {
            total: travelExpenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
            accounts: travelExpenses.map(acc => ({
              code: acc.code,
              name: acc.name,
              amount: Math.abs(acc.balance),
              percentage: totalExpenses > 0 ? (Math.abs(acc.balance) / totalExpenses) * 100 : 0
            }))
          }
        },
        detail: expenses.map(acc => ({
          code: acc.code,
          name: acc.name,
          amount: Math.abs(acc.balance),
          percentage: totalExpenses > 0 ? (Math.abs(acc.balance) / totalExpenses) * 100 : 0,
          transactionCount: acc.transactionCount
        }))
      },

      profitability: {
        grossProfit: {
          amount: grossProfit,
          margin: grossProfitMargin
        },
        operatingIncome: {
          amount: operatingIncome,
          margin: operatingMargin
        },
        netIncome: {
          amount: netIncome,
          margin: netProfitMargin
        }
      },

      performanceMetrics: {
        revenueGrowth: monthlyTrend.length > 1 ?
          ((monthlyTrend[monthlyTrend.length - 1].revenue - monthlyTrend[0].revenue) / monthlyTrend[0].revenue) * 100 : 0,
        expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0,
        averageMonthlyRevenue: monthlyTrend.length > 0 ?
          monthlyTrend.reduce((sum, m) => sum + m.revenue, 0) / monthlyTrend.length : 0,
        averageMonthlyProfit: monthlyTrend.length > 0 ?
          monthlyTrend.reduce((sum, m) => sum + m.profit, 0) / monthlyTrend.length : 0
      },

      monthlyTrend: monthlyTrend
    };

    return NextResponse.json(incomeStatement);

  } catch (error) {
    console.error('Error generating income statement:', error);
    return NextResponse.json(
      { error: 'Failed to generate income statement', details: error.message },
      { status: 500 }
    );
  }
}