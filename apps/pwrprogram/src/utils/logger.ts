import winston from 'winston';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFilePath = process.env.LOG_FILE_PATH || 'logs/app.log';

// Define custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

// Create transports array
const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
        level: logLevel,
    })
];

// Add file transport only in non-test environments
if (process.env.NODE_ENV !== 'test') {
    // Ensure logs directory exists
    const fs = require('fs');
    const logsDir = path.dirname(logFilePath);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    transports.push(
        // File transport for all logs
        new winston.transports.File({
            filename: logFilePath,
            format: logFormat,
            level: logLevel,
        }),
        // Separate file for errors
        new winston.transports.File({
            filename: path.join(path.dirname(logFilePath), 'error.log'),
            format: logFormat,
            level: 'error',
        })
    );
}

// Create the logger
export const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    // Don't exit on error
    exitOnError: false,
});

// Create a stream for Morgan HTTP logger middleware
export const loggerStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Helper to log with request context
export const logWithContext = (level: string, message: string, meta?: Record<string, any>) => {
    logger.log(level, message, meta);
};

export default logger;
