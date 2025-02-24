import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Program } from "./entity/program"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "password",
    database: "PwrProgram",
    synchronize: true,
    logging: false,
    entities: [User, Program],
    migrations: [],
    subscribers: [],
})
