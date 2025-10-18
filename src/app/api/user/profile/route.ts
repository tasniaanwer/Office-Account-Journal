import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      location,
      website,
      dateOfBirth,
      currentPassword,
      newPassword
    } = body;

    // Get current user from database
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = currentUser[0];
    const updateData: {
      updatedAt: Date;
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {
      updatedAt: new Date(),
    };

    // Handle profile information updates
    if (firstName !== undefined || lastName !== undefined) {
      // Combine firstName and lastName into the name field
      const first = firstName || user.name?.split(' ')[0] || '';
      const last = lastName || user.name?.split(' ').slice(1).join(' ') || '';
      updateData.name = `${first} ${last}`.trim() || user.name;
    }
    if (email !== undefined) updateData.email = email;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      updateData.passwordHash = newPasswordHash;
      console.log('Password update: New password hash generated for user:', user.email);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json({ error: 'Email is already taken' }, { status: 400 });
      }
    }

    // Update user in database
    console.log('Updating user in database with data:', { ...updateData, passwordHash: updateData.passwordHash ? '[REDACTED]' : 'UNCHANGED' });
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, user.id));
    console.log('Database update completed for user:', user.email);

    // Get updated user data (without password hash)
    const updatedUser = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: user[0] });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}