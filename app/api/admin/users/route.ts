import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

const userSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

// POST - Create new admin user
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, password } = userSchema.parse(body);

    // Check if user already exists
    const existing = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      [username]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List admin users
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await query<{
      id: number;
      username: string;
      created_at: Date;
    }>(
      'SELECT id, username, created_at FROM admin_users ORDER BY created_at DESC'
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin user
export async function DELETE(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    const currentUser = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      [session.user?.name]
    );

    if (currentUser.length > 0 && currentUser[0].id === parseInt(userId)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    await query('DELETE FROM admin_users WHERE id = $1', [parseInt(userId)]);

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
