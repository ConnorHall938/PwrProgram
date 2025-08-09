import { Block } from '../entity/block';
import { Cycle } from '../entity/cycle';
import { Exercise } from '../entity/exercise';
import { Program } from '../entity/program';
import { Session } from '../entity/session';
import { Set } from '../entity/set';
import { User } from '../entity/User';
import { createApp } from '../index';
import { ensureDatabases } from '../utils/ensure-database';

import { testDataSource } from './utils/test-data-source';

// Create and export the test app instance
export const app = createApp(testDataSource);

beforeAll(async () => {
    // Only initialize if not already initialized
    if (!testDataSource.isInitialized) {
        await ensureDatabases(['pwrprogram_test'], {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'password'
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
