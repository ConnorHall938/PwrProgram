import { CreateProgramDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

// Removed unused Program import
import { User } from '../../../entity/User';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';

const request = supertest.default(app);

describe('Program API', () => {
    // Only userRepo is needed (programRepo removed as unused)
    let userRepo: Repository<User>;
    let userID: string; // primary test user id
    let userCookie: string; // cookie string for primary user (e.g., 'session_id=...')

    async function loginUser(id: string): Promise<string> {
        const loginRes = await request.post(`/api/login/${id}`).send().expect(200);
        return loginRes.headers['set-cookie'][0].split(';')[0];
    }

    function auth(req: supertest.Test, cookie: string = userCookie) {
        return req.set('Cookie', [cookie]);
    }

    beforeAll(async () => {
        // programRepo intentionally omitted (unused)
        userRepo = testDataSource.getRepository(User);

        // Create primary user through API
        const createUserPayload = {
            firstName: 'Prog',
            email: `proguser-${Date.now()}@example.com`,
            password: 'securepass'
        };
        const userRes = await request.post('/api/users').send(createUserPayload).expect(201);
        userID = userRes.body.id;
        userCookie = await loginUser(userID);
    });

    it('should create a program for the current user and return it', async () => {
        const payload: CreateProgramDTO = { name: 'Strength Base', description: 'Base phase' };
        const res = await auth(request.post('/api/programs')).send(payload).expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(payload.name);
        expect(res.body.description).toBe(payload.description);
        expect(res.body.userId).toBe(userID);
    });

    it('should list programs only for the current user', async () => {
        // Capture baseline count
        const beforeRes = await auth(request.get('/api/programs')).expect(200);
        const baseline = beforeRes.body.length;

        // create 2 programs for primary user
        const names: string[] = [];
        for (let i = 0; i < 2; i++) {
            const name = `Prog ${Date.now()}-${i}`;
            names.push(name);
            await auth(request.post('/api/programs')).send({ name }).expect(201);
        }

        // create a different user and a program for that other user (should not show up)
        const otherUser = userRepo.create({ firstName: 'Other', email: `other-${Date.now()}@example.com`, password: 'passpass' });
        await userRepo.save(otherUser);
        const otherCookie = await loginUser(otherUser.id);
        await auth(request.post('/api/programs'), otherCookie).send({ name: 'Other Program' }).expect(201);

        const listRes = await auth(request.get('/api/programs')).expect(200);
        expect(Array.isArray(listRes.body)).toBe(true);
        // At least baseline + 2 new (could be more from previous tests in file)
        expect(listRes.body.length).toBeGreaterThanOrEqual(baseline + 2);
        const returnedNames = listRes.body.map((p: { name: string }) => p.name);
        for (const n of names) {
            expect(returnedNames).toContain(n);
        }
        for (const prog of listRes.body) {
            expect(prog.userId).toBe(userID);
        }
    });

    it('should fetch a program by id only if it belongs to the current user', async () => {
        const createRes = await auth(request.post('/api/programs')).send({ name: 'Fetch Me' }).expect(201);
        const programId = createRes.body.id;

        const getRes = await auth(request.get(`/api/programs/${programId}`)).expect(200);
        expect(getRes.body.id).toBe(programId);
        expect(getRes.body.userId).toBe(userID);

        // another user should get 404 when attempting to access
        const other = userRepo.create({ firstName: 'Other2', email: `other2-${Date.now()}@example.com`, password: 'passpass' });
        await userRepo.save(other);
        const otherCookie = await loginUser(other.id);
        await auth(request.get(`/api/programs/${programId}`), otherCookie).expect(404);
    });

    it('should return 400 on invalid create payload (missing name)', async () => {
        const res = await auth(request.post('/api/programs')).send({ description: 'No name' }).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors).toHaveProperty('name');
    });

    it('should reject unauthenticated access', async () => {
        await request.get('/api/programs').expect(401);
        await request.post('/api/programs').send({ name: 'X' }).expect(401);
    });
});
