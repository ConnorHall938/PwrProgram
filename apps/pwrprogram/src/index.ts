import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import { TypeormStore } from 'connect-typeorm';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { AppDataSource } from './data-source';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { openApiSpec } from './openapi';
import mountRoutes from './routes/index';
import { SessionStore } from './entity/SessionStore';
import { logger } from './utils/logger';

export function createApp(dataSource = AppDataSource) {
    const app = express();

    // Trust proxy - important for rate limiting and security headers when behind a reverse proxy
    app.set('trust proxy', 1);

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));

    // CORS configuration
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    app.use(cors({
        origin: corsOrigins,
        credentials: true, // Allow cookies
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting (disabled in test mode)
    if (process.env.NODE_ENV !== 'test') {
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later',
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        });
        app.use('/api/', limiter);
    }

    // Body parsing with size limits
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(cookieParser());

    // Session configuration with TypeORM store
    const sessionRepository = dataSource.getRepository(SessionStore);
    app.use(session({
        secret: process.env.SESSION_SECRET!,
        name: process.env.SESSION_NAME || 'pwrprogram.sid',
        resave: false,
        saveUninitialized: false,
        store: new TypeormStore({
            cleanupLimit: 2,
            ttl: parseInt(process.env.SESSION_MAX_AGE || '604800000') / 1000, // Convert ms to seconds
        }).connect(sessionRepository),
        cookie: {
            maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000'), // 7 days default
            httpOnly: true, // Prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax', // CSRF protection
        },
    }));

    // Request logging
    app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
        logger.http(`${req.method} ${req.path}`, {
            ip: req.ip,
            userId: req.session?.userId,
        });
        next();
    });

    // Mount API routes
    mountRoutes(app, dataSource);

    // Swagger docs
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

    // 404 handler (after all routes)
    app.use(notFoundHandler);

    // Central error handler (must be last)
    app.use(errorHandler);

    return app;
}

// Only start server if run directly (not in tests)
if (require.main === module) {
    AppDataSource.initialize().then(async () => {
        const app = createApp(AppDataSource);
        const port = parseInt(process.env.PORT || '3000');
        app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            logger.info(`API Documentation available at http://localhost:${port}/docs`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }).catch(error => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });
}
