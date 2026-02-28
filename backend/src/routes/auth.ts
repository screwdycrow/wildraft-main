import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { generateTokens, verifyRefreshToken } from '../lib/jwt';
import { authenticateToken } from '../middleware/auth';
import { hashPassword, comparePassword, validatePassword, validateEmail } from '../lib/password';
import {
  registerSchema,
  loginSchema,
  googleOAuthSchema,
  refreshTokenSchema,
  getMeSchema,
  logoutSchema,
} from '../schemas/auth.schemas';

export const authRoutes = async (fastify: FastifyInstance) => {
  // Email/Password Registration
  fastify.post<{ Body: { email: string; password: string; name?: string } }>(
    '/register',
    { schema: registerSchema },
    async (request, reply) => {
      try {
        const { email, password, name } = request.body;

        // Validate input
        if (!email || !password) {
          reply.code(400);
          return { error: 'Email and password are required' };
        }

        // Validate email format
        if (!validateEmail(email)) {
          reply.code(400);
          return { error: 'Invalid email format' };
        }

        // Validate password strength
        const passwordError = validatePassword(password);
        if (passwordError) {
          reply.code(400);
          return { error: passwordError };
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          reply.code(409);
          return { error: 'User with this email already exists' };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: name || null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
            createdAt: true,
          },
        });

        // Generate tokens
        const tokens = generateTokens({
          userId: user.id,
          email: user.email,
        });

        reply.code(201);
        return {
          message: 'User registered successfully',
          user,
          ...tokens,
        };
      } catch (error) {
        request.log.error({ error }, 'Registration error');
        reply.code(500);
        return {
          error: 'Registration failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Email/Password Login
  fastify.post<{ Body: { email: string; password: string } }>(
    '/login',
    { schema: loginSchema },
    async (request, reply) => {
      try {
        const { email, password } = request.body;

        // Validate input
        if (!email || !password) {
          reply.code(400);
          return { error: 'Email and password are required' };
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          reply.code(401);
          return { error: 'Invalid email or password' };
        }

        // Check if user has a password (might be Google-only user)
        if (!user.password) {
          reply.code(401);
          return {
            error: 'This account uses Google sign-in. Please login with Google.',
          };
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
          reply.code(401);
          return { error: 'Invalid email or password' };
        }

        // Generate tokens
        const tokens = generateTokens({
          userId: user.id,
          email: user.email,
        });

        return {
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
          },
          ...tokens,
        };
      } catch (error) {
        request.log.error({ error }, 'Login error');
        reply.code(500);
        return {
          error: 'Login failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Google OAuth Login - Initiates the OAuth flow
  fastify.get('/google', { schema: googleOAuthSchema }, async (request, reply) => {
    try {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

      if (!GOOGLE_CLIENT_ID) {
        reply.code(500);
        return { error: 'Google OAuth is not configured' };
      }

      // Build Google OAuth URL
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      reply.redirect(googleAuthUrl.toString());
    } catch (error) {
      reply.code(500);
      return {
        error: 'Failed to initiate Google OAuth',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Google OAuth Callback - Handles the OAuth callback
  fastify.get<{ Querystring: { code?: string; error?: string } }>(
    '/google/callback',
    async (request, reply) => {
      try {
        const { code, error } = request.query;

        if (error) {
          reply.code(400);
          return { error: 'OAuth authentication failed', details: error };
        }

        if (!code) {
          reply.code(400);
          return { error: 'No authorization code provided' };
        }

        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
          reply.code(500);
          return { error: 'Google OAuth is not configured' };
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          request.log.error({ errorData }, 'Token exchange failed');
          reply.code(500);
          return { error: 'Failed to exchange authorization code for tokens' };
        }

        const tokenData = await tokenResponse.json() as {
          access_token: string;
          refresh_token?: string;
        };
        const { access_token, refresh_token } = tokenData;

        // Get user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          reply.code(500);
          return { error: 'Failed to fetch user information from Google' };
        }

        const userInfo = await userInfoResponse.json() as {
          id: string;
          email: string;
          name?: string;
          picture?: string;
        };
        const { id: googleId, email, name, picture } = userInfo;

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (!user) {
          // Check if user exists with this email
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { email },
              data: {
                googleId,
                picture,
                refreshToken: refresh_token,
              },
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email,
                name,
                picture,
                googleId,
                refreshToken: refresh_token,
              },
            });
          }
        } else {
          // Update existing user
          user = await prisma.user.update({
            where: { googleId },
            data: {
              name,
              picture,
              refreshToken: refresh_token,
            },
          });
        }

        // Generate JWT tokens
        const tokens = generateTokens({
          userId: user.id,
          email: user.email,
        });

        // You can redirect to frontend with tokens or return them
        // For now, returning JSON response
        return {
          message: 'Authentication successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
          },
          ...tokens,
        };
      } catch (error) {
        request.log.error({ error }, 'Google callback error');
        reply.code(500);
        return {
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Refresh Token - Get new access token using refresh token
  fastify.post<{ Body: { refreshToken: string } }>(
    '/refresh',
    { schema: refreshTokenSchema },
    async (request, reply) => {
      try {
        const { refreshToken } = request.body;

        if (!refreshToken) {
          reply.code(400);
          return { error: 'Refresh token is required' };
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Verify user still exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          reply.code(401);
          return { error: 'User not found' };
        }

        // Generate new tokens
        const tokens = generateTokens({
          userId: user.id,
          email: user.email,
        });

        return {
          message: 'Tokens refreshed successfully',
          ...tokens,
        };
      } catch (error) {
        reply.code(401);
        return {
          error: 'Invalid refresh token',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get Current User - Protected route example
  fastify.get(
    '/me',
    { schema: getMeSchema, preHandler: authenticateToken },
    async (request, reply) => {
      try {
        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
          where: { id: request.user.userId },
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
            createdAt: true,
            aiSettings: true,
            openaiApiKey: true,
          },
        });

        if (!user) {
          reply.code(404);
          return { error: 'User not found' };
        }

        const { openaiApiKey, ...userData } = user;
        return {
          user: {
            ...userData,
            hasOpenaiApiKey: !!openaiApiKey,
          }
        };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to fetch user',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Logout - Invalidate tokens (optional implementation)
  fastify.post(
    '/logout',
    { schema: logoutSchema, preHandler: authenticateToken },
    async (request, reply) => {
      try {
        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        // Optional: Clear refresh token from database
        await prisma.user.update({
          where: { id: request.user.userId },
          data: { refreshToken: null },
        });

        return { message: 'Logged out successfully' };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Logout failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

