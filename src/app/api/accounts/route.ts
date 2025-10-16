import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET /api/accounts - List all accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');
    const isActive = searchParams.get('isActive');

    let query = db.select().from(accounts);

    // Apply filters
    const conditions = [];

    if (type) {
      conditions.push(eq(accounts.type, type as any));
    }

    if (parentId === 'null' || parentId === '') {
      conditions.push(isNull(accounts.parentId));
    } else if (parentId) {
      conditions.push(eq(accounts.parentId, parentId));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(accounts.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allAccounts = await query.orderBy(accounts.code);

    return NextResponse.json(allAccounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, type, parentId, description, normalBalance } = body;

    // Validation
    if (!code || !name || !type) {
      return NextResponse.json(
        { error: 'Code, name, and type are required' },
        { status: 400 }
      );
    }

    // Check if account code already exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.code, code))
      .limit(1);

    if (existingAccount.length > 0) {
      return NextResponse.json(
        { error: 'Account code already exists' },
        { status: 400 }
      );
    }

    // Validate normal balance based on account type
    const assetExpenseTypes = ['asset', 'expense'];
    const expectedNormalBalance = assetExpenseTypes.includes(type) ? 'debit' : 'credit';

    if (normalBalance && !['debit', 'credit'].includes(normalBalance)) {
      return NextResponse.json(
        { error: 'Normal balance must be either debit or credit' },
        { status: 400 }
      );
    }

    // Create new account
    const newAccount = {
      id: nanoid(),
      code: code.toUpperCase(),
      name,
      type: type as any,
      parentId: parentId || null,
      description: description || null,
      normalBalance: normalBalance || expectedNormalBalance,
      isActive: true,
    };

    const [insertedAccount] = await db.insert(accounts).values(newAccount).returning();

    return NextResponse.json(insertedAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}