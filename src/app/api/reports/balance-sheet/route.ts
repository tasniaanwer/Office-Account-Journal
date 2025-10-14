import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines, accounts } from '@/db/schema';
import { eq, and, gte, lte, sum, desc, sql } from 'drizzle-orm';
import { format, startOfDay, endOfDay } from 'date-fns';

// Balance Sheet API - Assets = Liabilities + Equity
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const asOfDate = searchParams.get('asOfDate');

    // Use asOfDate if provided, otherwise use dateTo, default to today
    const reportDate = asOfDate ? new Date(asOfDate) :
                      (dateTo ? new Date(dateTo) : new Date());
    const reportDateEnd = endOfDay(reportDate);
    const startDate = dateFrom ? startOfDay(new Date(dateFrom)) : new Date(0); // Beginning of time

    console.log('Generating Balance Sheet as of:', format(reportDate, 'yyyy-MM-dd'));

    // Get all accounts
    const allAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.isActive, true))
      .orderBy(accounts.code);

    // Get all transaction lines up to the report date
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
      })
      .from(transactionLines)
      .leftJoin(transactions, eq(transactionLines.transactionId, transactions.id))
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(and(
        gte(transactions.date, startDate),
        lte(transactions.date, reportDateEnd),
        sql`${transactions.status} IN ('posted', 'approved')`
      ))
      .groupBy(transactionLines.accountId, accounts.code, accounts.name, accounts.type, accounts.normalBalance)
      .having(sql`(sum(${transactionLines.debit}) - sum(${transactionLines.credit})) != 0`);

    // Calculate balances for all accounts
    const accountBalances = new Map();

    // Initialize all accounts
    allAccounts.forEach(account => {
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
        isActive: true
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

    // Categorize accounts
    const assets = Array.from(accountBalances.values())
      .filter(acc => acc.type === 'asset' && acc.balance !== 0)
      .sort((a, b) => a.code.localeCompare(b.code));

    const liabilities = Array.from(accountBalances.values())
      .filter(acc => acc.type === 'liability' && acc.balance !== 0)
      .sort((a, b) => a.code.localeCompare(b.code));

    const equity = Array.from(accountBalances.values())
      .filter(acc => acc.type === 'equity' && acc.balance !== 0)
      .sort((a, b) => a.code.localeCompare(b.code));

    // Calculate totals
    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    // Group assets by category
    const currentAssets = assets.filter(acc =>
      ['1010', '1020', '1030', '1040', '1110', '1120'].includes(acc.code)
    );
    const nonCurrentAssets = assets.filter(acc =>
      ['1210', '1220', '1230', '1240'].includes(acc.code)
    );

    // Group liabilities by category
    const currentLiabilities = liabilities.filter(acc =>
      ['2010', '2020', '2030', '2110', '2120'].includes(acc.code)
    );
    const nonCurrentLiabilities = liabilities.filter(acc =>
      ['2210', '2220'].includes(acc.code)
    );

    // Balance Sheet validation
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
    const balanceDifference = totalAssets - (totalLiabilities + totalEquity);

    const balanceSheet = {
      metadata: {
        reportType: 'Balance Sheet',
        asOfDate: format(reportDate, 'yyyy-MM-dd'),
        generatedAt: new Date().toISOString(),
        currency: 'USD'
      },

      assets: {
        current: {
          total: currentAssets.reduce((sum, acc) => sum + acc.balance, 0),
          accounts: currentAssets.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.balance,
            percentage: totalAssets > 0 ? (acc.balance / totalAssets) * 100 : 0
          }))
        },
        nonCurrent: {
          total: nonCurrentAssets.reduce((sum, acc) => sum + acc.balance, 0),
          accounts: nonCurrentAssets.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.balance,
            percentage: totalAssets > 0 ? (acc.balance / totalAssets) * 100 : 0
          }))
        },
        total: totalAssets
      },

      liabilities: {
        current: {
          total: currentLiabilities.reduce((sum, acc) => sum + acc.balance, 0),
          accounts: currentLiabilities.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.balance,
            percentage: totalLiabilities > 0 ? (acc.balance / totalLiabilities) * 100 : 0
          }))
        },
        nonCurrent: {
          total: nonCurrentLiabilities.reduce((sum, acc) => sum + acc.balance, 0),
          accounts: nonCurrentLiabilities.map(acc => ({
            code: acc.code,
            name: acc.name,
            balance: acc.balance,
            percentage: totalLiabilities > 0 ? (acc.balance / totalLiabilities) * 100 : 0
          }))
        },
        total: totalLiabilities
      },

      equity: {
        total: totalEquity,
        accounts: equity.map(acc => ({
          code: acc.code,
          name: acc.name,
          balance: acc.balance,
          percentage: totalEquity > 0 ? (acc.balance / totalEquity) * 100 : 0
        }))
      },

      summary: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesPlusEquity: totalLiabilities + totalEquity,
        validation: {
          isBalanced,
          balanceDifference,
          accountingEquation: `Assets ($${totalAssets.toFixed(2)}) = Liabilities ($${totalLiabilities.toFixed(2)}) + Equity ($${totalEquity.toFixed(2)})`
        }
      },

      financialRatios: {
        debtToEquityRatio: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
        debtToAssetRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
        currentRatio: currentLiabilities.reduce((sum, acc) => sum + acc.balance, 0) > 0 ?
          currentAssets.reduce((sum, acc) => sum + acc.balance, 0) /
          currentLiabilities.reduce((sum, acc) => sum + acc.balance, 0) : 0
      }
    };

    return NextResponse.json(balanceSheet);

  } catch (error) {
    console.error('Error generating balance sheet:', error);
    return NextResponse.json(
      { error: 'Failed to generate balance sheet', details: error.message },
      { status: 500 }
    );
  }
}