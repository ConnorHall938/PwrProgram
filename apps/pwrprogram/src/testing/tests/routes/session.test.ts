import { CreateProgramDTO, CreateCycleDTO, CreateBlockDTO, CreateSessionDTO, UpdateSessionDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';

// Removed unused repository/entity imports
import { app } from '../../setup';

const request = supertest.default(app);

describe('Session API', () => {
    // Repository variables removed (not directly used)
    // let programRepo: Repository<Program>;
    // let cycleRepo: Repository<Cycle>;
    // let blockRepo: Repository<Block>;
    // let sessionRepo: Repository<Session>;
    // let userRepo: Repository<User>;
    let userID: string;
    let programID: string;
    let cycleID: string;
    let blockID: string;
    let userCookie: string;

    async function loginUser(id: string): Promise<string> {
        const loginRes = await request.post(`/api/login/${id}`).send().expect(200);
        return loginRes.headers['set-cookie'][0].split(';')[0];
    }
    function auth(r: supertest.Test, cookie: string = userCookie) { return r.set('Cookie', [cookie]); }

    beforeAll(async () => {
        // Repositories retrieved directly via API usage only; local vars removed.

        const userRes = await request.post('/api/users').send({ firstName: 'SessionUser', email: `session-${Date.now()}@example.com`, password: 'securepass' }).expect(201);
        userID = userRes.body.id;
        userCookie = await loginUser(userID);

        const programRes = await auth(request.post('/api/programs')).send({ name: 'Sess Program' } as CreateProgramDTO).expect(201);
        programID = programRes.body.id;
        const cycleRes = await request.post(`/api/cycles/${programID}/cycles`).send({ name: 'Sess Cycle' } as CreateCycleDTO).expect(201);
        cycleID = cycleRes.body.id;
        const blockRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'Sess Block' } as CreateBlockDTO).expect(201);
        blockID = blockRes.body.id;
    });

    it('should create a session and return DTO with links', async () => {
        const payload: CreateSessionDTO = { name: 'Day 1', description: 'Upper body' };
        const res = await request.post(`/api/sessions/${blockID}/sessions`).send(payload).expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(payload.name);
        expect(res.body.blockId).toBe(blockID);
        expect(res.body._links.self).toBe(`/api/blocks/${blockID}/sessions/${res.body.id}`);
    });

    it('should list sessions for a block', async () => {
        const before = await request.get(`/api/sessions/${blockID}/sessions`).expect(200);
        const baseline = before.body.length;
        await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'List S1' }).expect(201);
        await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'List S2' }).expect(201);
        const after = await request.get(`/api/sessions/${blockID}/sessions`).expect(200);
        expect(after.body.length).toBeGreaterThanOrEqual(baseline + 2);
    });

    it('should fetch a session by id', async () => {
        const c = await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'Fetch Session' }).expect(201);
        const id = c.body.id;
        const res = await request.get(`/api/sessions/${id}`).expect(200);
        expect(res.body.id).toBe(id);
        expect(res.body.blockId).toBe(blockID);
    });

    it('should patch a session', async () => {
        const c = await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'Patch Session' }).expect(201);
        const id = c.body.id;
        const patch: UpdateSessionDTO = { name: 'Patched', description: 'Changed', completed: true };
        const res = await request.patch(`/api/sessions/${id}`).send(patch).expect(200);
        expect(res.body.name).toBe('Patched');
        expect(res.body.description).toBe('Changed');
        expect(res.body.completed).toBe(true);
    });

    // Negative cases
    it('should validate create payload (missing name)', async () => {
        const res = await request.post(`/api/sessions/${blockID}/sessions`).send({ description: 'No name' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toHaveProperty('name');
    });

    it('should return 404 for non-existent session fetch', async () => {
        await request.get('/api/sessions/00000000-0000-0000-0000-000000000000').expect(404);
    });

    it('should return 404 on patch for non-existent session', async () => {
        await request.patch('/api/sessions/00000000-0000-0000-0000-000000000000').send({ name: 'Nope' }).expect(404);
    });

    it('should reject invalid type on patch (completed not boolean)', async () => {
        const c = await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'Bool Session' }).expect(201);
        const id = c.body.id;
        const res = await request.patch(`/api/sessions/${id}`).send({ completed: 'yes' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.completed).toBeDefined();
    });

    it('should toggle completion false->true->false', async () => {
        const created = await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'Toggle Session' }).expect(201);
        const id = created.body.id;
        expect(created.body.completed).toBe(false);
        const toTrue = await request.patch(`/api/sessions/${id}`).send({ completed: true }).expect(200);
        expect(toTrue.body.completed).toBe(true);
        const toFalse = await request.patch(`/api/sessions/${id}`).send({ completed: false }).expect(200);
        expect(toFalse.body.completed).toBe(false);
    });
});
