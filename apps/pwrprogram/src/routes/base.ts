import * as Express from 'express';
import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Express.Router();

export default function baseRouter(dataSource: DataSource): Express.Router {
    const userRepository = dataSource.getRepository(User);

    /**
     * POST /auth/register
     * Register a new user
     */
    router.post('/auth/register', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const { email, password, firstName, lastName } = req.body;

        // Validation
        if (!email || !password || !firstName) {
            throw new ValidationError('Email, password, and first name are required');
        }

        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long');
        }

        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            throw new ValidationError('A user with this email already exists');
        }

        // Create new user
        const user = userRepository.create({
            email: email.toLowerCase(),
            password, // Will be hashed by @BeforeInsert hook
            firstName,
            lastName,
            isEmailVerified: false,
        });

        await userRepository.save(user);

        // TODO: Send email verification (placeholder for future)
        // user.generateEmailVerificationToken();
        // await sendVerificationEmail(user.email, user.emailVerificationToken);

        // Log the user in automatically after registration
        req.session.userId = user.id;

        logger.info('User registered', { userId: user.id, email: user.email });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified,
            },
        });
    }));

    /**
     * POST /auth/login
     * Login with email and password
     */
    router.post('/auth/login', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // Find user with password field (it's excluded by default with select: false)
        const user = await userRepository.findOne({
            where: { email: email.toLowerCase() },
            select: ['id', 'email', 'firstName', 'lastName', 'password', 'isEmailVerified'],
        });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            logger.warn('Failed login attempt', { email });
            throw new UnauthorizedError('Invalid email or password');
        }

        // Create session
        req.session.userId = user.id;

        logger.info('User logged in', { userId: user.id, email: user.email });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified,
            },
        });
    }));

    /**
     * POST /auth/logout
     * Logout current user
     */
    router.post('/auth/logout', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        const userId = req.session?.userId;

        req.session.destroy((err) => {
            if (err) {
                logger.error('Error destroying session', { error: err, userId });
            }
        });

        res.clearCookie(process.env.SESSION_NAME || 'pwrprogram.sid');

        logger.info('User logged out', { userId });

        res.status(200).json({
            message: 'Logout successful',
        });
    }));

    /**
     * GET /auth/me
     * Get current user info
     */
    router.get('/auth/me', asyncHandler(async (req: Express.Request, res: Express.Response) => {
        if (!req.session?.userId) {
            throw new UnauthorizedError('Not authenticated');
        }

        const user = await userRepository.findOne({
            where: { id: req.session.userId },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
            },
        });
    }));

    return router;
}