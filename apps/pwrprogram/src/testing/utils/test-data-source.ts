import { DataSource } from 'typeorm';

import { Block, Cycle, Exercise, Program, Session, Set, User } from '../../entity';

// Create a test data source with the same config but different database
export const testDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "pwrprogram_test",
    entities: [User, Program, Cycle, Block, Session, Exercise, Set],
    dropSchema: true,
    synchronize: true,
    logging: false
});
