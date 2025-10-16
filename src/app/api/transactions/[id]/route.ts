import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { transactions, transactionLines } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const transaction = await db
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
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (transaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, status } = body;
    const { id } = await params;

    // Check if transaction exists
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = existingTransaction[0];

    // Check if transaction can be edited (only draft status can be edited)
    if (transaction.status !== 'draft' && description) {
      return NextResponse.json(
        { error: 'Only draft transactions can be edited' },
        { status: 400 }
      );
    }

    // Check if user can approve (only admin or accountant can approve)
    if (status === 'approved') {
      const userRole = session.user.role;
      if (!['admin', 'accountant'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Only admin or accountant can approve transactions' },
          { status: 403 }
        );
      }
    }

    // Update transaction
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'approved') {
        updateData.approvedBy = session.user.id;
      }
    }

    const [updatedTransaction] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if transaction exists
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = existingTransaction[0];

    // Only draft transactions can be deleted
    if (transaction.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft transactions can be deleted' },
        { status: 400 }
      );
    }

    // Delete transaction lines first (due to foreign key constraint)
    await db
      .delete(transactionLines)
      .where(eq(transactionLines.transactionId, id));

    // Delete transaction
    await db.delete(transactions).where(eq(transactions.id, id));

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}