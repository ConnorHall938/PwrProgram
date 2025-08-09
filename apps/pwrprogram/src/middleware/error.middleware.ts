import { NextFunction, Request, Response } from 'express';

// Generic error handler to centralize 500 responses & logging.
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
    if (res.headersSent) {
        return; // Let Express handle if headers already sent
    }
    console.error('Unhandled error:', err);
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    res.status(status).json({ message: err?.message || 'Internal server error' });
}
