import { Block, Cycle, Exercise, Program, Session, Set, User } from '../entity';
import { createApp } from '../index';
import { ensureDatabase } from '../utils/ensure-database';

import { testDataSource } from './utils/test-data-source';

// Create and export the test app instance
export const app = createApp(testDataSource);

beforeAll(async () => {
    // Only initialize if not already initialized
    if (!testDataSource.isInitialized) {
        await ensureDatabase({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_DATABASE || 'pwrprogram_test'
        });
        await testDataSource.initialize();
    }
    // Clear the database before running tests
    await testDataSource.getRepository(Set).delete({});
    await testDataSource.getRepository(Exercise).delete({});
    await testDataSource.getRepository(Session).delete({});
    await testDataSource.getRepository(Block).delete({});
    await testDataSource.getRepository(Cycle).delete({});
    await testDataSource.getRepository(Program).delete({});
    await testDataSource.getRepository(User).delete({});
});

beforeEach(async () => {

});

afterAll(async () => {
    if (testDataSource.isInitialized) {
        await testDataSource.destroy();
    }
});
