import "reflect-metadata"
import { DataSource } from "typeorm"
import { ensureDatabase } from './utils/ensure-database';
import { User } from "./entity/User"
import { Program } from "./entity/program"
import { Cycle } from "./entity/cycle"
import { Block } from "./entity/block"
import { Session } from "./entity/session"
import { Exercise } from "./entity/exercise"
import { Set } from "./entity/set"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "password",
    database: "pwrprogram",
    synchronize: true,
    logging: false,
    entities: [User, Program, Cycle, Block, Session, Exercise, Set],
    migrations: [],
    subscribers: [],
})

// Ensure database exists (fire and forget; initialization should await this in app bootstrap if strict ordering needed)
ensureDatabase({ host: 'localhost', port: 5432, user: 'postgres', password: 'password', database: 'pwrprogram' })
    .catch(err => console.error('Failed ensuring main database:', err));
