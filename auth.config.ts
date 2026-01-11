import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        // Get IP from request
        const ip = request.headers?.get('x-forwarded-for') || 
                   request.headers?.get('x-real-ip') || 
                   'unknown';

        // Check rate limit
        const { limited, remainingAttempts } = checkRateLimit(ip);
        if (limited) {
          throw new Error('Too many login attempts. Please try again in 15 minutes.');
        }

        const { username, password } = credentials as { username: string; password: string };

        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        try {
          const users = await query<{ id: number; username: string; password_hash: string }>(
            'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
            [username]
          );

          if (users.length === 0) {
            throw new Error('Invalid username or password');
          }

          const user = users[0];
          const passwordValid = await bcrypt.compare(password, user.password_hash);

          if (!passwordValid) {
            throw new Error('Invalid username or password');
          }

          // Reset rate limit on successful login
          resetRateLimit(ip);

          return {
            id: user.id.toString(),
            name: user.username,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
};
