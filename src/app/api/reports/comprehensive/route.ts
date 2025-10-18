import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines, accounts, users } from '@/db/schema';
import { eq, and, gte, lte, sum, desc, sql } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

// Comprehensive Reports API - Complete Financial System
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const reportType = searchParams.get('type') || 'overview';

    // Set default date range to last 6 months if not provided
    const defaultDateFrom = subMonths(new Date(), 6);
    const defaultDateTo = new Date();

    const startDate = dateFrom ? startOfDay(new Date(dateFrom)) : defaultDateFrom;
    const endDate = dateTo ? endOfDay(new Date(dateTo)) : defaultDateTo;

    console.log('Generating comprehensive reports for:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reportType
    });

    // 1. Get complete account structure
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.isActive, true))
      .orderBy(accounts.code);

    // Handle case with no accounts
    if (!allAccounts || allAccounts.length === 0) {
      return NextResponse.json({
        metadata: {
          reportGenerated: new Date().toISOString(),
          dateRange: {
            from: format(startDate, 'yyyy-MM-dd'),
            to: format(endDate, 'yyyy-MM-dd')
          },
          totalAccounts: 0,
          activeAccounts: 0,
          inactiveAccounts: 0,
          totalTransactions: 0,
          message: 'No accounts found in the system'
        },
        balanceSheet: { assets: { total: 0, accounts: [] }, liabilities: { total: 0, accounts: [] }, equity: { total: 0, accounts: [] } },
        incomeStatement: { revenue: { total: 0, accounts: [] }, expenses: { total: 0, accounts: [] }, netIncome: 0 },
        analytics: { monthlyTrends: [], topRevenueCategories: [], topExpenseCategories: [], accountTypeDistribution: {} }
      });
    }

    // 2. Get all transaction data with proper relationships
    const transactionData = await db
      .select({
        transactionId: transactions.id,
        transactionDate: transactions.date,
        transactionReference: transactions.reference,
        transactionDescription: transactions.description,
        transactionStatus: transactions.status,
        transactionCreatedBy: transactions.createdBy,
        transactionApprovedBy: transactions.approvedBy,
        transactionCreatedAt: transactions.createdAt,
        lineId: transactionLines.id,
        accountId: transactionLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountType: accounts.type,
        accountNormalBalance: accounts.normalBalance,
        lineDescription: transactionLines.description,
        lineDebit: transactionLines.debit,
        lineCredit: transactionLines.credit,
        lineCreatedAt: transactionLines.createdAt,
      })
      .from(transactions)
      .innerJoin(transactionLines, eq(transactions.id, transactionLines.transactionId))
      .innerJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        sql`${transactions.status} IN ('posted', 'approved')`, // Include both posted and approved
        eq(accounts.isActive, true)
      ))
      .orderBy(desc(transactions.date), transactions.reference);

    // 3. Calculate account balances with proper accounting
    const accountBalances = new Map();

    // Initialize all accounts with zero balances
    allAccounts.forEach(account => {
      accountBalances.set(account.id, {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        openingBalance: 0,
        debit: 0,
        credit: 0,
        netChange: 0,
        closingBalance: 0,
        transactionCount: 0
      });
    });

    // Process all transaction lines
    transactionData.forEach(row => {
      if (!row.accountId) return;

      const account = accountBalances.get(row.accountId);
      if (!account) return;

      account.debit += Number(row.lineDebit || 0);
      account.credit += Number(row.lineCredit || 0);
      account.transactionCount += 1;
    });

    // Calculate net changes and closing balances using proper accounting rules
    accountBalances.forEach(account => {
      // Calculate net change based on account type and normal balance
      if (account.normalBalance === 'debit') {
        // For accounts with normal debit balance (Assets, Expenses)
        account.netChange = account.debit - account.credit;
      } else {
        // For accounts with normal credit balance (Liabilities, Equity, Revenue)
        account.netChange = account.credit - account.debit;
      }

      // For this report, we assume opening balance of zero
      // In a real system, you'd fetch opening balances from accounting periods
      account.closingBalance = account.netChange;
    });

    // 4. Generate Financial Statements

    // Balance Sheet Calculations
    const assets = Array.from(accountBalances.values()).filter(acc => acc.type === 'asset');
    const liabilities = Array.from(accountBalances.values()).filter(acc => acc.type === 'liability');
    const equity = Array.from(accountBalances.values()).filter(acc => acc.type === 'equity');

    const totalAssets = assets.reduce((sum, acc) => sum + acc.closingBalance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.closingBalance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.closingBalance, 0);

    // Income Statement Calculations
    const revenues = Array.from(accountBalances.values()).filter(acc => acc.type === 'revenue');
    const expenses = Array.from(accountBalances.values()).filter(acc => acc.type === 'expense');

    const totalRevenue = revenues.reduce((sum, acc) => sum + acc.closingBalance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + Math.abs(acc.closingBalance), 0);
    const netIncome = totalRevenue - totalExpenses;

    // 5. Monthly Analysis for Trends
    const monthlyAnalysis = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(currentDate, i));
      const monthEnd = endOfMonth(subMonths(currentDate, i));

      const monthTransactions = transactionData.filter(row =>
        row.transactionDate >= monthStart && row.transactionDate <= monthEnd
      );

      const monthRevenue = monthTransactions
        .filter(row => row.accountType === 'revenue')
        .reduce((sum, row) => {
          // For revenue accounts, credit increases the balance
          const creditAmount = Number(row.lineCredit || 0);
          const debitAmount = Number(row.lineDebit || 0);
          return sum + (creditAmount - debitAmount);
        }, 0);

      const monthExpenses = monthTransactions
        .filter(row => row.accountType === 'expense')
        .reduce((sum, row) => {
          // For expense accounts, debit increases the balance
          const debitAmount = Number(row.lineDebit || 0);
          const creditAmount = Number(row.lineCredit || 0);
          return sum + (debitAmount - creditAmount);
        }, 0);

      const monthProfit = monthRevenue - monthExpenses;

      monthlyAnalysis.push({
        month: format(monthStart, 'MMM yyyy'),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthProfit,
        transactionCount: new Set(monthTransactions.map(t => t.transactionId)).size
      });
    }

    // 6. Cash Flow Analysis
    const operatingCashFlow = monthlyAnalysis.map(m => ({
      month: m.month,
      operating: m.revenue - m.expenses,
      investing: 0, // Will be calculated based on asset transactions
      financing: 0, // Will be calculated based on liability/equity transactions
      netCash: m.revenue - m.expenses
    }));

    // 7. Top Categories Analysis
    const revenueCategories = revenues
      .map(acc => ({
        name: acc.name,
        code: acc.code,
        amount: acc.closingBalance, // Revenue accounts already have positive balances
        percentage: totalRevenue > 0 ? (acc.closingBalance / totalRevenue) * 100 : 0
      }))
      .filter(acc => acc.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const expenseCategories = expenses
      .map(acc => ({
        name: acc.name,
        code: acc.code,
        amount: Math.abs(acc.closingBalance), // Expense accounts should be positive for display
        percentage: totalExpenses > 0 ? (Math.abs(acc.closingBalance) / totalExpenses) * 100 : 0
      }))
      .filter(acc => acc.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // 8. Account Activity Analysis
    const activeAccounts = Array.from(accountBalances.values())
      .filter(acc => acc.transactionCount > 0)
      .sort((a, b) => b.transactionCount - a.transactionCount);

    const inactiveAccounts = Array.from(accountBalances.values())
      .filter(acc => acc.transactionCount === 0);

    // 9. Trial Balance
    const trialBalance = Array.from(accountBalances.values())
      .filter(acc => acc.closingBalance !== 0)
      .map(acc => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: acc.closingBalance > 0 ? acc.closingBalance : 0,
        credit: acc.closingBalance < 0 ? Math.abs(acc.closingBalance) : 0,
        balance: acc.closingBalance
      }));

    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

    // 10. Key Performance Indicators
    const kpis = {
      grossProfitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      netProfitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      returnOnAssets: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      debtToEquity: totalEquity > 0 ? (totalLiabilities / totalEquity) * 100 : 0,
      currentRatio: totalLiabilities > 0 ? (totalAssets / totalLiabilities) : 0,
      operatingCashFlowRatio: totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0
    };

    const response = {
      metadata: {
        reportGenerated: new Date().toISOString(),
        dateRange: {
          from: format(startDate, 'yyyy-MM-dd'),
          to: format(endDate, 'yyyy-MM-dd')
        },
        totalAccounts: allAccounts.length,
        activeAccounts: activeAccounts.length,
        inactiveAccounts: inactiveAccounts.length,
        totalTransactions: new Set(transactionData.map(t => t.transactionId)).size
      },

      // Balance Sheet
      balanceSheet: {
        assets: {
          total: totalAssets,
          accounts: assets.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.closingBalance,
            percentage: totalAssets > 0 ? (acc.closingBalance / totalAssets) * 100 : 0
          })),
          categories: {
            currentAssets: assets.filter(a => ['1010', '1020', '1030', '1040', '1110', '1120'].includes(a.code)),
            fixedAssets: assets.filter(a => ['1210', '1220', '1230', '1240'].includes(a.code))
          }
        },
        liabilities: {
          total: totalLiabilities,
          accounts: liabilities.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.closingBalance,
            percentage: totalLiabilities > 0 ? (acc.closingBalance / totalLiabilities) * 100 : 0
          })),
          categories: {
            currentLiabilities: liabilities.filter(a => ['2010', '2020', '2030', '2110', '2120'].includes(a.code)),
            longTermLiabilities: liabilities.filter(a => ['2210', '2220'].includes(a.code))
          }
        },
        equity: {
          total: totalEquity,
          accounts: equity.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.closingBalance,
            percentage: totalEquity > 0 ? (acc.closingBalance / totalEquity) * 100 : 0
          }))
        },
        validation: {
          assetsEqualsLiabilitiesPlusEquity: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
          difference: totalAssets - (totalLiabilities + totalEquity)
        }
      },

      // Income Statement
      incomeStatement: {
        revenue: {
          total: totalRevenue,
          accounts: revenueCategories
        },
        expenses: {
          total: totalExpenses,
          accounts: expenseCategories
        },
        netIncome: netIncome,
        profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      },

      // Cash Flow Statement
      cashFlow: {
        operating: operatingCashFlow,
        summary: {
          netOperatingCashFlow: operatingCashFlow.reduce((sum, m) => sum + m.operating, 0),
          averageMonthlyCashFlow: operatingCashFlow.reduce((sum, m) => sum + m.netCash, 0) / operatingCashFlow.length
        }
      },

      // Trial Balance
      trialBalance: {
        accounts: trialBalance,
        validation: {
          totalDebits: totalDebits,
          totalCredits: totalCredits,
          balanced: Math.abs(totalDebits - totalCredits) < 0.01,
          difference: totalDebits - totalCredits
        }
      },

      // Analytics
      analytics: {
        monthlyTrends: monthlyAnalysis,
        topRevenueCategories: revenueCategories.slice(0, 10),
        topExpenseCategories: expenseCategories.slice(0, 10),
        mostActiveAccounts: activeAccounts.slice(0, 10),
        accountTypeDistribution: {
          assets: { count: assets.length, total: totalAssets },
          liabilities: { count: liabilities.length, total: totalLiabilities },
          equity: { count: equity.length, total: totalEquity },
          revenue: { count: revenues.length, total: totalRevenue },
          expenses: { count: expenses.length, total: totalExpenses }
        }
      },

      // Key Performance Indicators
      kpis: kpis,

      // Chart Data
      charts: {
        monthlyPerformance: monthlyAnalysis,
        revenueBreakdown: revenueCategories,
        expenseBreakdown: expenseCategories,
        balanceSheetComposition: [
          { name: 'Assets', value: totalAssets, color: '#3b82f6' },
          { name: 'Liabilities', value: totalLiabilities, color: '#ef4444' },
          { name: 'Equity', value: totalEquity, color: '#10b981' }
        ],
        cashFlow: operatingCashFlow
      }
    };

    console.log('Comprehensive reports generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating comprehensive reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports', details: error.message },
      { status: 500 }
    );
  }
}