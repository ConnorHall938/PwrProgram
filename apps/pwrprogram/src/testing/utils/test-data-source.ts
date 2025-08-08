import { DataSource } from 'typeorm';
import { User } from '../../entity/User';
import { Program } from '../../entity/program';
import { Cycle } from '../../entity/cycle';
import { Block } from '../../entity/block';
import { Session } from '../../entity/session';
import { Exercise } from '../../entity/exercise';
import { Set } from '../../entity/set';

// Create a test data source with the same config but different database
export const testDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "password",
    database: "pwrprogram_test",
    entities: [User, Program, Cycle, Block, Session, Exercise, Set],
    dropSchema: true,
    synchronize: true,
    logging: false
});
