import "reflect-metadata"
import { DataSource } from "typeorm"
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
    database: "PwrProgram",
    synchronize: true,
    logging: false,
    entities: [User, Program, Cycle, Block, Session, Exercise, Set],
    migrations: [],
    subscribers: [],
})
