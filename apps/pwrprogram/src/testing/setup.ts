import { testDataSource } from './utils/test-data-source';
import { createApp } from '../index';
import { Set } from '../entity/set';
import { Exercise } from '../entity/exercise';
import { Session } from '../entity/session';
import { Block } from '../entity/block';
import { Cycle } from '../entity/cycle';
import { Program } from '../entity/program';
import { User } from '../entity/User';

// Create and export the test app instance
export const app = createApp(testDataSource);

beforeAll(async () => {
    // Only initialize if not already initialized
    if (!testDataSource.isInitialized) {
        await testDataSource.initialize();
    }
});

beforeEach(async () => {
    // Remove all data from all tables, in order
    await testDataSource.getRepository(User).delete({});
    await testDataSource.getRepository(Program).delete({});
    await testDataSource.getRepository(Cycle).delete({});
    await testDataSource.getRepository(Block).delete({});
    await testDataSource.getRepository(Session).delete({});
    await testDataSource.getRepository(Exercise).delete({});
    await testDataSource.getRepository(Set).delete({});
});

afterAll(async () => {
    if (testDataSource.isInitialized) {
        await testDataSource.destroy();
    }
});
