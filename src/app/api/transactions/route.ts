import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines, accounts } from '@/db/schema';
import { eq, desc, and, gte, lte, sum, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(transactions.status, status as any));
    }

    if (dateFrom) {
      conditions.push(gte(transactions.date, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(transactions.date, new Date(dateTo)));
    }

    // Get transactions with their line items
    let query = db
      .select({
        id: transactions.id,
        date: transactions.date,
        reference: transactions.reference,
        description: transactions.description,
        status: transactions.status,
        createdBy: transactions.createdBy,
        approvedBy: transactions.approvedBy,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const transactionList = await query
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset);

    // Get line items for each transaction
    const transactionsWithLines = await Promise.all(
      transactionList.map(async (transaction) => {
        const lines = await db
          .select({
            id: transactionLines.id,
            accountId: transactionLines.accountId,
            accountCode: accounts.code,
            accountName: accounts.name,
            description: transactionLines.description,
            debit: transactionLines.debit,
            credit: transactionLines.credit,
          })
          .from(transactionLines)
          .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
          .where(eq(transactionLines.transactionId, transaction.id));

        return {
          ...transaction,
          lines,
          totalDebit: lines.reduce((sum, line) => sum + line.debit, 0),
          totalCredit: lines.reduce((sum, line) => sum + line.credit, 0),
        };
      })
    );

    // Get total count
    const countQuery = db.select({ count: { count: transactions.id } }).from(transactions);
    const totalCountResult = conditions.length > 0
      ? await countQuery.where(and(...conditions))
      : await countQuery;
    const totalCount = totalCountResult.length;

    return NextResponse.json({
      transactions: transactionsWithLines,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - only admin and accountant can create transactions
    const userRole = session.user.role;
    if (!['admin', 'accountant'].includes(userRole)) {
      console.error(`Unauthorized transaction creation attempt - user role: ${userRole}`);
      return NextResponse.json({
        error: 'Forbidden - Only admin and accountant roles can create transactions'
      }, { status: 403 });
    }

    const body = await request.json();
    const { date, description, lines, status = 'draft' } = body;

    // Validation
    if (!date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: 'Date, description, and at least 2 line items are required' },
        { status: 400 }
      );
    }

    // Validate double-entry principle
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'Transaction must balance: Total debits must equal total credits' },
        { status: 400 }
      );
    }

    // Validate line items
    for (const line of lines) {
      if (!line.accountId || (!line.debit && !line.credit)) {
        return NextResponse.json(
          { error: 'Each line must have an account and either debit or credit amount' },
          { status: 400 }
        );
      }

      if (line.debit && line.credit) {
        return NextResponse.json(
          { error: 'Each line can have either debit or credit, not both' },
          { status: 400 }
        );
      }
    }

    // Check if all accounts exist and are active
    const accountIds = lines.map(line => line.accountId);

    // Check if all provided account IDs exist and are active
    const existingAccounts = await db
      .select({ id: accounts.id, isActive: accounts.isActive })
      .from(accounts)
      .where(and(
        inArray(accounts.id, accountIds),
        eq(accounts.isActive, true)
      ));

    // Find which account IDs are valid (exist and active)
    const validAccountIds = existingAccounts.map(acc => acc.id);
    const invalidAccounts = accountIds.filter(id => !validAccountIds.includes(id));

    if (invalidAccounts.length > 0) {
      console.error('Invalid or inactive account IDs:', invalidAccounts);
      return NextResponse.json(
        {
          error: 'Some accounts are invalid or inactive',
          invalidAccounts
        },
        { status: 400 }
      );
    }

    // Generate reference number
    const reference = `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Create transaction
    const newTransaction = {
      id: nanoid(),
      date: new Date(date),
      reference,
      description,
      status: status as any,
      createdBy: session.user.id,
    };

    const [insertedTransaction] = await db
      .insert(transactions)
      .values(newTransaction)
      .returning();

    // Create transaction lines
    const newLines = lines.map((line: any) => ({
      id: nanoid(),
      transactionId: insertedTransaction.id,
      accountId: line.accountId,
      description: line.description || description,
      debit: line.debit || 0,
      credit: line.credit || 0,
    }));

    await db.insert(transactionLines).values(newLines);

    // Return the created transaction with lines
    const createdTransaction = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        reference: transactions.reference,
        description: transactions.description,
        status: transactions.status,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.id, insertedTransaction.id))
      .limit(1);

    const createdLines = await db
      .select({
        id: transactionLines.id,
        accountId: transactionLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        description: transactionLines.description,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
      })
      .from(transactionLines)
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(eq(transactionLines.transactionId, insertedTransaction.id));

    return NextResponse.json({
      ...createdTransaction[0],
      lines: createdLines,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}