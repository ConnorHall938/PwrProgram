import pg from 'pg';
const {Pool} = pg;

const sqlPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'PwrProgram',
    user: 'postgres',
    password: 'password',
})

export default sqlPool;

export async function query(text: string, params: any[]) {
    return await sqlPool.query(text, params);
}

export async function setupDatabase(): Promise<boolean> {
    // Create the database
    let create_schema_result = await query(`CREATE SCHEMA IF NOT EXISTS PwrProgram`,[]);
    if(create_schema_result)
        console.log('Database created');
    else{
        console.log('Database creation failed');
        console.log(create_schema_result);
        return false;
    }
    // Create the tables
    let table_promises = [
        ["User Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.users (
id SERIAL,
name VARCHAR(255),
email VARCHAR(255) NOT NULL,
password VARCHAR(255),
PRIMARY KEY(id),
UNIQUE(email))`,[])],
        ["User Coach Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.user_coach (
user_id INTEGER NOT NULL REFERENCES PwrProgram.users(id),
coach_id INTEGER NOT NULL REFERENCES PwrProgram.users(id),
PRIMARY KEY(user_id, coach_id))`,[])],
        ["Programs Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.programs (
program_id INTEGER,
name VARCHAR(255),
description VARCHAR(255),
user_id INTEGER REFERENCES PwrProgram.users(id),
coach_id INTEGER REFERENCES PwrProgram.users(id),
PRIMARY KEY(user_id, program_id))`,[])],
        ["Program Cycle Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.program_cycles (
cycle_id INTEGER,
program_id INTEGER,
user_id INTEGER,
name VARCHAR(255),
description VARCHAR(255),
PRIMARY KEY(user_id, program_id, cycle_id),
FOREIGN KEY(program_id, user_id) REFERENCES PwrProgram.programs (program_id, user_id))`,[])],
        ["Cycle Block Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.cycle_block (
block_id INTEGER,
user_id INTEGER,
program_id INTEGER,
cycle_id INTEGER,
name VARCHAR(255), description VARCHAR(255),
PRIMARY KEY(user_id, program_id, cycle_id, block_id),
FOREIGN KEY(user_id, program_id, cycle_id) REFERENCES PwrProgram.program_cycles(user_id, program_id, cycle_id))`,[])],
        ["Exercise Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.exercises (
user_id INTEGER,
program_id INTEGER,
cycle_id INTEGER,
block_id INTEGER,
week_number INTEGER,
session_number INTEGER,
exercise_number INTEGER,
name VARCHAR(255),
description VARCHAR(255),
tutorial_link VARCHAR(255),
PRIMARY KEY(user_id, program_id, cycle_id, block_id, week_number, session_number, exercise_number),
FOREIGN KEY(user_id, program_id, cycle_id, block_id) REFERENCES PwrProgram.cycle_block(user_id, program_id, cycle_id, block_id))`,[])],
        ["Exercise Set Table", query(`CREATE TABLE IF NOT EXISTS PwrProgram.exercise_sets (
user_id INTEGER,
program_id INTEGER,
cycle_id INTEGER,
block_id INTEGER,
week_number INTEGER,
session_number INTEGER,
exercise_number INTEGER,
set_number INTEGER,
target_reps INTEGER,
target_rpe INTEGER,
target_weight INTEGER,
actual_reps INTEGER,
actual_rpe INTEGER,
actual_weight INTEGER,
PRIMARY KEY(user_id, program_id, cycle_id, block_id, week_number, session_number, exercise_number, set_number),
FOREIGN KEY(user_id, program_id, cycle_id, block_id, week_number, session_number, exercise_number) REFERENCES PwrProgram.exercises(user_id, program_id, cycle_id, block_id, week_number, session_number, exercise_number))`,[])],
    ];
    try{
        for (let table_promise of table_promises){
            let table_result = await table_promise[1];
            if(table_result)
                console.log(`Successfully created ${table_promise[0]}`);
            else{
                console.log(`Failed to create ${table_promise[0]}`);
                return false;
            }
        }
        console.log("Successfully created tables");
    }
    catch(err){
        console.log("Failed to create tables");
        console.log(err);
        return false;
    }
    
    return true;
}
