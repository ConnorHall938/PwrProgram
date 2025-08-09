import * as supertest from 'supertest';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { Repository } from 'typeorm';
import { Program } from '../../../entity/program';
import { User } from '../../../entity/User';
import { Cycle } from '../../../entity/cycle';
import { Block } from '../../../entity/block';
import { Session } from '../../../entity/session';
import { Exercise } from '../../../entity/exercise';
import { CreateProgramDTO, CreateCycleDTO, CreateBlockDTO, CreateSessionDTO, CreateExerciseDTO, UpdateExerciseDTO } from '@pwrprogram/shared';

const request = supertest.default(app);

describe('Exercise API', () => {
    let programID: string; let cycleID: string; let blockID: string; let sessionID: string; let userID: string; let userCookie: string;

    async function loginUser(id: string): Promise<string> { const loginRes = await request.post(`/api/login/${id}`).send().expect(200); return loginRes.headers['set-cookie'][0].split(';')[0]; }
    function auth(r: supertest.Test, cookie: string = userCookie) { return r.set('Cookie', [cookie]); }

    beforeAll(async () => {
        const userRes = await request.post('/api/users').send({ firstName: 'ExerciseUser', email: `exercise-${Date.now()}@example.com`, password: 'securepass' }).expect(201);
        userID = userRes.body.id; userCookie = await loginUser(userID);
        const programRes = await auth(request.post('/api/programs')).send({ name: 'Ex Program' } as CreateProgramDTO).expect(201); programID = programRes.body.id;
        const cycleRes = await request.post(`/api/cycles/${programID}/cycles`).send({ name: 'Ex Cycle' } as CreateCycleDTO).expect(201); cycleID = cycleRes.body.id;
        const blockRes = await request.post(`/api/blocks/${cycleID}/blocks`).send({ name: 'Ex Block' } as CreateBlockDTO).expect(201); blockID = blockRes.body.id;
        const sessionRes = await request.post(`/api/sessions/${blockID}/sessions`).send({ name: 'Ex Session' } as CreateSessionDTO).expect(201); sessionID = sessionRes.body.id;
    });

    it('should create an exercise', async () => {
        const payload: CreateExerciseDTO = { name: 'Bench Press', description: 'Barbell flat bench' } as any;
        const res = await request.post(`/api/exercises/${sessionID}/exercises`).send(payload).expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Bench Press');
        expect(res.body.sessionId).toBe(sessionID);
        expect(res.body._links.self).toBe(`/api/sessions/${sessionID}/exercises/${res.body.id}`);
    });

    it('should list exercises for a session', async () => {
        const before = await request.get(`/api/exercises/${sessionID}/exercises`).expect(200);
        const baseline = before.body.length;
        await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'List Ex1' }).expect(201);
        await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'List Ex2' }).expect(201);
        const after = await request.get(`/api/exercises/${sessionID}/exercises`).expect(200);
        expect(after.body.length).toBeGreaterThanOrEqual(baseline + 2);
    });

    it('should fetch an exercise by id', async () => {
        const c = await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'Fetch Ex' }).expect(201);
        const id = c.body.id;
        const res = await request.get(`/api/exercises/${id}`).expect(200);
        expect(res.body.id).toBe(id);
        expect(res.body.sessionId).toBe(sessionID);
    });

    it('should patch an exercise', async () => {
        const c = await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'Patch Ex' }).expect(201);
        const id = c.body.id;
        const patch: UpdateExerciseDTO = { name: 'Patched Ex', description: 'Updated', completed: true } as any;
        const res = await request.patch(`/api/exercises/${id}`).send(patch).expect(200);
        expect(res.body.name).toBe('Patched Ex');
        expect(res.body.description).toBe('Updated');
        expect(res.body.completed).toBe(true);
    });

    // Negative cases
    it('should validate create payload (missing name)', async () => {
        const res = await request.post(`/api/exercises/${sessionID}/exercises`).send({ description: 'No name' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toHaveProperty('name');
    });

    it('should 404 on non-existent exercise fetch', async () => {
        await request.get('/api/exercises/00000000-0000-0000-0000-000000000000').expect(404);
    });

    it('should 404 on non-existent exercise patch', async () => {
        await request.patch('/api/exercises/00000000-0000-0000-0000-000000000000').send({ name: 'Nope' }).expect(404);
    });

    it('should reject invalid type on patch (completed not boolean)', async () => {
        const c = await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'Bool Ex' }).expect(201);
        const id = c.body.id;
        const res = await request.patch(`/api/exercises/${id}`).send({ completed: 'yes' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.completed).toBeDefined();
    });

    it('should toggle completion false->true->false', async () => {
        const created = await request.post(`/api/exercises/${sessionID}/exercises`).send({ name: 'Toggle Ex' }).expect(201);
        const id = created.body.id;
        expect(created.body.completed).toBe(false);
        const toTrue = await request.patch(`/api/exercises/${id}`).send({ completed: true }).expect(200);
        expect(toTrue.body.completed).toBe(true);
        const toFalse = await request.patch(`/api/exercises/${id}`).send({ completed: false }).expect(200);
        expect(toFalse.body.completed).toBe(false);
    });
});
