import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import oauthPlugin from '@fastify/oauth2';
import { User, AuthProvider } from '../models';
import { env } from '../config';

// Validation schemas
const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').max(100),
});

const signinSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
function generateToken(userId: string, email: string): string {
    return jwt.sign(
        { userId, email },
        env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export default async function authRoutes(app: FastifyInstance) {
    // Register Google OAuth
    await app.register(oauthPlugin, {
        name: 'googleOAuth2',
        scope: ['profile', 'email'],
        credentials: {
            client: {
                id: env.GOOGLE_CLIENT_ID,
                secret: env.GOOGLE_CLIENT_SECRET,
            },
        },
        startRedirectPath: '/api/auth/google',
        callbackUri: `http://localhost:${env.PORT}/api/auth/google/callback`,
        discovery: {
            issuer: 'https://accounts.google.com',
        },
    });

    // Register GitHub OAuth
    await app.register(oauthPlugin, {
        name: 'githubOAuth2',
        scope: ['user:email', 'read:user'],
        credentials: {
            client: {
                id: env.GITHUB_CLIENT_ID,
                secret: env.GITHUB_CLIENT_SECRET,
            },
        },
        startRedirectPath: '/api/auth/github',
        callbackUri: `http://localhost:${env.PORT}/api/auth/github/callback`,
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
        authorizePath: '/login/oauth/authorize',
    });

    // Email/Password Signup
    app.post('/api/auth/signup', async (request, reply) => {
        try {
            const body = signupSchema.parse(request.body);

            // Check if user already exists
            const existingUser = await User.findOne({ email: body.email.toLowerCase() });
            if (existingUser) {
                return reply.status(400).send({
                    error: 'User already exists',
                    message: 'An account with this email already exists. Please sign in instead.'
                });
            }

            // Hash password with Argon2
            const passwordHash = await argon2.hash(body.password, {
                type: argon2.argon2id,
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 4,
            });

            // Create user
            const user = await User.create({
                email: body.email.toLowerCase(),
                passwordHash,
                name: body.name,
                provider: AuthProvider.EMAIL,
            });

            // Generate token
            const token = generateToken(user._id.toString(), user.email);

            return reply.status(201).send({
                message: 'Account created successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
                token,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Validation error',
                    details: error.errors
                });
            }
            app.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Email/Password Signin
    app.post('/api/auth/signin', async (request, reply) => {
        try {
            const body = signinSchema.parse(request.body);

            // Find user
            const user = await User.findOne({
                email: body.email.toLowerCase(),
                provider: AuthProvider.EMAIL
            });

            if (!user || !user.passwordHash) {
                return reply.status(401).send({
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect.'
                });
            }

            // Verify password
            const validPassword = await argon2.verify(user.passwordHash, body.password);
            if (!validPassword) {
                return reply.status(401).send({
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect.'
                });
            }

            // Generate token
            const token = generateToken(user._id.toString(), user.email);

            return reply.send({
                message: 'Signed in successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
                token,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'Validation error',
                    details: error.errors
                });
            }
            app.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Google OAuth Callback
    app.get('/api/auth/google/callback', async (request, reply) => {
        try {
            // @ts-ignore - OAuth plugin adds this method
            const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

            // Get user info from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });
            const googleUser = await userInfoResponse.json() as {
                id: string;
                email: string;
                name: string
            };

            // Find or create user
            let user = await User.findOne({
                provider: AuthProvider.GOOGLE,
                providerId: googleUser.id
            });

            if (!user) {
                // Check if email already exists with different provider
                const existingEmail = await User.findOne({ email: googleUser.email.toLowerCase() });
                if (existingEmail) {
                    return reply.redirect(
                        `${env.FRONTEND_URL}/login?error=email_exists&provider=${existingEmail.provider}`
                    );
                }

                user = await User.create({
                    email: googleUser.email.toLowerCase(),
                    name: googleUser.name,
                    provider: AuthProvider.GOOGLE,
                    providerId: googleUser.id,
                });
            }

            // Generate JWT token
            const jwtToken = generateToken(user._id.toString(), user.email);

            // Redirect to frontend with token
            return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
        } catch (error) {
            app.log.error(error);
            return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    });

    // GitHub OAuth Callback
    app.get('/api/auth/github/callback', async (request, reply) => {
        try {
            // @ts-ignore - OAuth plugin adds this method
            const { token } = await app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

            // Get user info from GitHub
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${token.access_token}`,
                    'User-Agent': 'Contract-Webhook-API',
                },
            });
            const githubUser = await userResponse.json() as {
                id: number;
                email: string | null;
                name: string | null;
                login: string;
            };

            // Get email if not public
            let email = githubUser.email;
            if (!email) {
                const emailsResponse = await fetch('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `Bearer ${token.access_token}`,
                        'User-Agent': 'Contract-Webhook-API',
                    },
                });
                const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean }>;
                const primaryEmail = emails.find(e => e.primary);
                email = primaryEmail?.email || emails[0]?.email;
            }

            if (!email) {
                return reply.redirect(`${env.FRONTEND_URL}/login?error=no_email`);
            }

            // Find or create user
            let user = await User.findOne({
                provider: AuthProvider.GITHUB,
                providerId: githubUser.id.toString()
            });

            if (!user) {
                // Check if email already exists with different provider
                const existingEmail = await User.findOne({ email: email.toLowerCase() });
                if (existingEmail) {
                    return reply.redirect(
                        `${env.FRONTEND_URL}/login?error=email_exists&provider=${existingEmail.provider}`
                    );
                }

                user = await User.create({
                    email: email.toLowerCase(),
                    name: githubUser.name || githubUser.login,
                    provider: AuthProvider.GITHUB,
                    providerId: githubUser.id.toString(),
                });
            }

            // Generate JWT token
            const jwtToken = generateToken(user._id.toString(), user.email);

            // Redirect to frontend with token
            return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
        } catch (error) {
            app.log.error(error);
            return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    });

    // Get current user (for verifying token)
    app.get('/api/auth/me', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };

            const user = await User.findById(decoded.userId).select('-passwordHash');
            if (!user) {
                return reply.status(401).send({ error: 'User not found' });
            }

            return reply.send({
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    provider: user.provider,
                },
            });
        } catch (error) {
            return reply.status(401).send({ error: 'Invalid token' });
        }
    });
}
