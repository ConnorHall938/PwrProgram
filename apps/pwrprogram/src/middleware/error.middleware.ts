import { NextFunction, Request, Response } from 'express';

interface HasStatusCode { statusCode?: number }
interface HasMessage { message?: string }

// Generic error handler to centralize 500 responses & logging.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
    if (res.headersSent) return; // Let Express handle if headers already sent

    const status = (typeof (err as HasStatusCode)?.statusCode === 'number'
        ? (err as HasStatusCode).statusCode
        : 500) || 500;
    const message = (err as HasMessage)?.message || 'Internal server error';
    // Minimal logging (could plug structured logger here later)

    console.error('Unhandled error:', err);
    res.status(status).json({ message });
}
