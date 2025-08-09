import { CreateProgramDTO, CreateCycleDTO, CreateBlockDTO, UpdateBlockDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';

import { app } from '../../setup';

const request = supertest.default(app);

describe('Block API', () => {
    // Removed unused repository variables
    let userID: string;
    let programID: string;
    let cycleID: string;
    let userCookie: string;

    async function loginUser(id: string): Promise<string> {
        const loginRes = await request.post(`/api/login/${id}`).send().expect(200);
        return loginRes.headers['set-cookie'][0].split(';')[0];
    }

    function auth(req: supertest.Test, cookie: string = userCookie) {
        return req.set('Cookie', [cookie]);
    }

    beforeAll(async () => {
        // Repository retrieval removed (unused)

        // user + auth
        const userRes = await request.post('/api/users').send({
            firstName: 'BlockUser',
            email: `blockuser-${Date.now()}@example.com`,
            password: 'securepass'
        }).expect(201);
        userID = userRes.body.id;
        userCookie = await loginUser(userID);

        // program
        const programRes = await auth(request.post('/api/programs')).send({ name: 'Block Program' } as CreateProgramDTO).expect(201);
        programID = programRes.body.id;

        // cycle (no auth needed but fine)
        const cycleRes = await request.post(`/api/cycles/${programID}/cycles`).send({ name: 'Block Cycle' } as CreateCycleDTO).expect(201);
        cycleID = cycleRes.body.id;
    });

    it('should create a block in a cycle and return DTO with links', async () => {
        const payload: CreateBlockDTO = { name: 'Base Block', description: 'Hypertrophy', goals: ['Size'], sessionsPerWeek: 4 };
        const res = await request.post(`/api/blocks/${cycleID}/blocks`).send(payload).expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(payload.name);
        expect(res.body.cycleId).toBe(cycleID);
        expect(res.body._links.self).toBe(`/api/cycles/${cycleID}/blocks/${res.body.id}`);
        expect(res.body._links.cycle).toBe(`/api/cycles/${cycleID}`);
        expect(res.body._links.sessions).toBe(`/api/blocks/${res.body.id}/sessions`);
    });

    it('should list blocks for a cycle including newly created ones', async () => {
        const before = await request.get(`/api/blocks/${cycleID}/blocks`).expect(200);
        const baseline = before.body.length;
        for (let i = 0; i < 2; i++) {
            await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: `Block ${Date.now()}-${i}` }).expect(201);
        }
        const after = await request.get(`/api/blocks/${cycleID}/blocks`).expect(200);
        expect(after.body.length).toBeGreaterThanOrEqual(baseline + 2);
        for (const b of after.body) {
            expect(b.cycleId).toBe(cycleID);
            expect(b._links).toBeDefined();
        }
    });

    it('should fetch a block by id', async () => {
        const createRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'FetchBlock' }).expect(201);
        const blockId = createRes.body.id;
        const getRes = await request.get(`/api/blocks/${blockId}`).expect(200);
        expect(getRes.body.id).toBe(blockId);
        expect(getRes.body.cycleId).toBe(cycleID);
    });

    it('should patch a block and reflect updated fields', async () => {
        const createRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'PatchBlock' }).expect(201);
        const blockId = createRes.body.id;
        const patchPayload: UpdateBlockDTO = { name: 'Patched Block', description: 'Updated block', completed: true, sessionsPerWeek: 5 };
        const patchRes = await request.patch(`/api/blocks/${blockId}`).send(patchPayload).expect(200);
        expect(patchRes.body.name).toBe('Patched Block');
        expect(patchRes.body.description).toBe('Updated block');
        expect(patchRes.body.completed).toBe(true);
    });

    // Negative cases
    it('should validate block creation payload (missing name)', async () => {
        const res = await request.post(`/api/blocks/${cycleID}/blocks`).send({ description: 'No name' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toHaveProperty('name');
    });

    it('should reject invalid sessionsPerWeek (<1)', async () => {
        const res = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'BadSessions', sessionsPerWeek: 0 }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.sessionsPerWeek).toBeDefined();
    });

    it('should return 404 when patching a non-existent block', async () => {
        const bogus = '00000000-0000-0000-0000-000000000000';
        await request.patch(`/api/blocks/${bogus}`).send({ name: 'Nope' }).expect(404);
    });

    it('should reject invalid type on patch (completed not boolean)', async () => {
        const createRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'BoolBlock' }).expect(201);
        const id = createRes.body.id;
        const res = await request.patch(`/api/blocks/${id}`).send({ completed: 'yes' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.completed).toBeDefined();
    });

    it('should toggle completion false->true->false', async () => {
        const createRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'ToggleBlock' }).expect(201);
        const id = createRes.body.id;
        expect(createRes.body.completed).toBe(false);
        const toTrue = await request.patch(`/api/blocks/${id}`).send({ completed: true }).expect(200);
        expect(toTrue.body.completed).toBe(true);
        const toFalse = await request.patch(`/api/blocks/${id}`).send({ completed: false }).expect(200);
        expect(toFalse.body.completed).toBe(false);
    });

    it('should return 404 for a non-existent block id on fetch', async () => {
        const bogus = '11111111-1111-1111-1111-111111111111';
        await request.get(`/api/blocks/${bogus}`).expect(404);
    });
});
