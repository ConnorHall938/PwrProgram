import { CreateProgramDTO, CreateCycleDTO, CreateBlockDTO, CreateSessionDTO, CreateExerciseDTO, CreateSetDTO, UpdateSetDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';

import { app } from '../../setup';

const request = supertest.default(app);

describe('Set API', () => {
    let programID: string; let cycleID: string; let blockID: string; let sessionID: string; let exerciseID: string; let userID: string; let userCookie: string;

    async function loginUser(id: string): Promise<string> { const loginRes = await request.post(`/api/login/${id}`).send().expect(200); return loginRes.headers['set-cookie'][0].split(';')[0]; }
    function auth(r: supertest.Test, cookie: string = userCookie) { return r.set('Cookie', [cookie]); }

    beforeAll(async () => {
        const userRes = await request.post('/api/users').send({ firstName: 'SetUser', email: `set-${Date.now()}@example.com`, password: 'securepass' }).expect(201);
        userID = userRes.body.id; userCookie = await loginUser(userID);
        const programRes = await auth(request.post('/api/programs')).send({ name: 'Set Program' } as CreateProgramDTO).expect(201); programID = programRes.body.id;
        const cycleRes = await request.post(`/api/cycles/${programID}/cycles`).send({ name: 'Set Cycle' } as CreateCycleDTO).expect(201); cycleID = cycleRes.body.id;
        const blockRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'Set Block' } as CreateBlockDTO).expect(201); blockID = blockRes.body.id;
        const sessionRes = await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'Set Session' } as CreateSessionDTO).expect(201); sessionID = sessionRes.body.id;
        const exerciseRes = await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'Set Exercise' } as CreateExerciseDTO).expect(201); exerciseID = exerciseRes.body.id;
    });

    it('should create a set', async () => {
        const payload: CreateSetDTO = { targetReps: 5, targetWeight: 100 };
        const res = await request.post(`/api/sets/${exerciseID}/sets`).send(payload).expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.exerciseId).toBe(exerciseID);
        expect(res.body._links.self).toBe(`/api/exercises/${exerciseID}/sets/${res.body.id}`);
    });

    it('should list sets for an exercise', async () => {
        const before = await request.get(`/api/sets/${exerciseID}/sets`).expect(200);
        const baseline = before.body.length;
        await request.post(`/api/sets/${exerciseID}/sets`).send({ targetReps: 3 }).expect(201);
        await request.post(`/api/sets/${exerciseID}/sets`).send({ targetReps: 4 }).expect(201);
        const after = await request.get(`/api/sets/${exerciseID}/sets`).expect(200);
        expect(after.body.length).toBeGreaterThanOrEqual(baseline + 2);
    });

    it('should fetch a set by id', async () => {
        const c = await request.post(`/api/sets/${exerciseID}/sets`).send({ targetReps: 8 }).expect(201);
        const id = c.body.id;
        const res = await request.get(`/api/sets/${id}`).expect(200);
        expect(res.body.id).toBe(id);
        expect(res.body.exerciseId).toBe(exerciseID);
    });

    it('should patch a set', async () => {
        const c = await request.post(`/api/sets/${exerciseID}/sets`).send({ targetReps: 6 }).expect(201);
        const id = c.body.id;
        const patch: UpdateSetDTO = { targetReps: 10, completed: true, notes: 'All reps easy' };
        const res = await request.patch(`/api/sets/${id}`).send(patch).expect(200);
        expect(res.body.targetReps).toBe(10);
    });

    // Negative cases
    it('should validate create payload (invalid targetRpe)', async () => {
        const res = await request.post(`/api/sets/${exerciseID}/sets`).send({ targetRpe: 11 }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.targetRpe).toBeDefined();
    });

    it('should 404 on non-existent set fetch', async () => {
        await request.get('/api/sets/00000000-0000-0000-0000-000000000000').expect(404);
    });

    it('should 404 on non-existent set patch', async () => {
        await request.patch('/api/sets/00000000-0000-0000-0000-000000000000').send({ targetReps: 1 }).expect(404);
    });

    it('should reject invalid type on patch (completed not boolean)', async () => {
        const c = await request.post(`/api/sets/${exerciseID}/sets`).send({ targetReps: 5 }).expect(201);
        const id = c.body.id;
        const res = await request.patch(`/api/sets/${id}`).send({ completed: 'yes' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.completed).toBeDefined();
    });

    it('should toggle completion false->true->false', async () => {
        const created = await request.post(`/api/sets/${exerciseID}/sets`).send({ targetReps: 2 }).expect(201);
        const id = created.body.id;
        expect(created.body.completed).toBe(false);
        const toTrue = await request.patch(`/api/sets/${id}`).send({ completed: true }).expect(200);
        expect(toTrue.body.completed).toBe(true);
        const toFalse = await request.patch(`/api/sets/${id}`).send({ completed: false }).expect(200);
        expect(toFalse.body.completed).toBe(false);
    });
});
