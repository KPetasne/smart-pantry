/**
 * Authentication and Authorization Helper Functions
 * Provides role-based access control (RBAC) utilities for API routes
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { query } from './db';

export type UserRole = 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

/**
 * Get the authenticated user with their role from the database
 * Returns null if not authenticated or user not found
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  
  if (!session?.user?.name) {
    return null;
  }

  try {
    const users = await query<{ id: string; username: string; role: UserRole }>(
      'SELECT id, username, role FROM admin_users WHERE username = $1',
      [session.user.name]
    );

    if (users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns error response if not authenticated, otherwise returns the authenticated user
 */
export async function requireAuth(): Promise<NextResponse | AuthUser> {
  const user = await getAuthUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Middleware to require admin role (admin or super_admin)
 * Returns error response if not authorized, otherwise returns the authenticated user
 */
export async function requireAdmin(): Promise<NextResponse | AuthUser> {
  const authResult = await requireAuth();
  
  // If requireAuth returned a response (error), return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult as AuthUser;

  if (!user.role || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return NextResponse.json(
      { error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Middleware to require super_admin role
 * Returns error response if not authorized, otherwise returns the authenticated user
 */
export async function requireSuperAdmin(): Promise<NextResponse | AuthUser> {
  const authResult = await requireAuth();
  
  // If requireAuth returned a response (error), return it
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult as AuthUser;

  if (user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Forbidden. Super admin access required.' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (role === 'admin') {
    // Both admin and super_admin have admin privileges
    return user.role === 'admin' || user.role === 'super_admin';
  }
  return user.role === role;
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === 'super_admin';
}
