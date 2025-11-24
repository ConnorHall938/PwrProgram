import { Request, Response, NextFunction } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { logger } from '../utils/logger';

// Custom error class for application errors
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed') {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409);
    }
}

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Default error values
    let statusCode = 500;
    let message = 'Internal server error';
    let errors: any = undefined;

    // Handle different error types
    if (err instanceof AppError) {
        // Custom application errors
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof EntityNotFoundError) {
        // TypeORM entity not found
        statusCode = 404;
        message = 'Resource not found';
    } else if (err instanceof QueryFailedError) {
        // Database query errors
        statusCode = 400;
        message = 'Database operation failed';

        // Handle specific PostgreSQL errors
        const pgError = err as any;
        if (pgError.code === '23505') {
            // Unique constraint violation
            statusCode = 409;
            message = 'Resource already exists';

            // Extract field name from error detail if available
            if (pgError.detail) {
                const match = pgError.detail.match(/Key \((.+)\)=/);
                if (match) {
                    message = `A resource with this ${match[1]} already exists`;
                }
            }
        } else if (pgError.code === '23503') {
            // Foreign key constraint violation
            message = 'Referenced resource does not exist';
        } else if (pgError.code === '23502') {
            // Not null constraint violation
            message = 'Required field is missing';
        }
    } else if (err.name === 'ValidationError') {
        // Class-validator errors
        statusCode = 400;
        message = 'Validation failed';
        errors = (err as any).errors;
    }

    // Log error
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel]('Request error', {
        message: err.message,
        statusCode,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.session?.userId,
    });

    // Don't leak error details in production
    const response: any = {
        error: message,
    };

    // Include stack trace and details in development
    if (process.env.NODE_ENV === 'development') {
        response.details = err.message;
        response.stack = err.stack;
        if (errors) {
            response.validationErrors = errors;
        }
    }

    res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 * Must be registered after all routes but before error handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    logger.warn('Route not found', {
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
