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
