import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { Block } from "./entity/block";
import { Cycle } from "./entity/cycle";
import { Exercise } from "./entity/exercise";
import { Program } from "./entity/program";
import { Session as SessionEntity } from "./entity/session";
import { Set } from "./entity/set";
import { User } from "./entity/User";
import { SessionStore } from "./entity/SessionStore";
import { ensureDatabase } from './utils/ensure-database';
import { logger } from './utils/logger';

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'SESSION_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    logger.error('Please create a .env file based on .env.example');
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    // Disable synchronize in production - use migrations instead
    synchronize: !isProduction,
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
    entities: [User, Program, Cycle, Block, SessionEntity, Exercise, Set, SessionStore],
    migrations: [],
    subscribers: [],
    // Connection pool configuration for better performance
    extra: {
        max: 10, // Maximum pool size
        min: 2,  // Minimum pool size
        idleTimeoutMillis: 30000, // Close idle connections after 30s
    },
});

// Ensure database exists (fire and forget; initialization should await this in app bootstrap if strict ordering needed)
ensureDatabase({
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!
})
    .catch(err => logger.error('Failed ensuring main database:', err));
