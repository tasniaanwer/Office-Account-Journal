import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, transactionLines } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

// GET /api/accounts/[id] - Get single account
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const account = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(account[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PUT /api/accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, parentId, description, normalBalance, isActive } = body;

    // Check if account exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if account is used in transactions (prevent deletion of active accounts)
    if (isActive === false) {
      const transactionCount = await db
        .select({ count: count() })
        .from(transactionLines)
        .where(eq(transactionLines.accountId, id));

      if (transactionCount[0].count > 0) {
        return NextResponse.json(
          { error: 'Cannot deactivate account that is used in transactions' },
          { status: 400 }
        );
      }
    }

    // Validate normal balance
    if (normalBalance && !['debit', 'credit'].includes(normalBalance)) {
      return NextResponse.json(
        { error: 'Normal balance must be either debit or credit' },
        { status: 400 }
      );
    }

    // Update account
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (description !== undefined) updateData.description = description;
    if (normalBalance !== undefined) updateData.normalBalance = normalBalance;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedAt = new Date();

    const [updatedAccount] = await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, id))
      .returning();

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    // Check if account exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Check if account is used in transactions
    const transactionCount = await db
      .select({ count: count() })
      .from(transactionLines)
      .where(eq(transactionLines.accountId, id));

    if (transactionCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account that is used in transactions' },
        { status: 400 }
      );
    }

    // Check if account has child accounts
    const childAccountsCount = await db
      .select({ count: count() })
      .from(accounts)
      .where(eq(accounts.parentId, id));

    if (childAccountsCount[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account that has child accounts' },
        { status: 400 }
      );
    }

    // Delete account
    await db.delete(accounts).where(eq(accounts.id, id));

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}