import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Express Request type to include session with userId
declare module 'express-session' {
    interface SessionData {
        userId: string;
    }
}

/**
 * Middleware to require authentication
 * Checks if user is logged in via session
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.userId) {
        logger.warn('Unauthorized access attempt', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(401).json({
            error: 'Unauthorized',
            message: 'You must be logged in to access this resource',
        });
        return;
    }

    // User is authenticated, proceed
    next();
};

/**
 * Middleware to optionally authenticate
 * Adds user info to request if logged in, but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    // Just continue - session will be available if user is logged in
    next();
};

/**
 * Middleware to check if user owns the resource
 * Must be used after requireAuth
 */
export const requireOwnership = (paramName: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const resourceUserId = req.params[paramName];
        const sessionUserId = req.session?.userId;

        if (!sessionUserId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'You must be logged in',
            });
            return;
        }

        if (resourceUserId !== sessionUserId) {
            logger.warn('Unauthorized resource access attempt', {
                sessionUserId,
                resourceUserId,
                path: req.path,
            });
            res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this resource',
            });
            return;
        }

        next();
    };
};
