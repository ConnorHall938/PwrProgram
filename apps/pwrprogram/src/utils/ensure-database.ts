import { Client } from 'pg';

export interface EnsureDatabaseOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string; // target database to ensure
}

export async function ensureDatabase(opts: EnsureDatabaseOptions): Promise<void> {
    const { host, port, user, password, database } = opts;
    const adminClient = new Client({ host, port, user, password, database: 'postgres' });
    await adminClient.connect();
    try {
        const res = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
        if (res.rowCount === 0) {
            await adminClient.query(`CREATE DATABASE ${database.replace(/"/g, '""')}`);
        }
    } finally {
        await adminClient.end();
    }
}

export async function ensureDatabases(databases: string[], base: Omit<EnsureDatabaseOptions, 'database'>) {
    for (const db of databases) {
        await ensureDatabase({ ...base, database: db });
    }
}
