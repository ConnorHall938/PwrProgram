import { CreateSetDTO, UpdateSetDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { Set } from '../../../entity/set';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('Set API', () => {
    let setRepo: Repository<Set>;

    beforeAll(async () => {
        setRepo = testDataSource.getRepository(Set);
    });

    describe('POST /api/exercises/:exerciseId/sets', () => {
        it('should require authentication', async () => {
            const exerciseId = '00000000-0000-0000-0000-000000000000';
            const payload: CreateSetDTO = { targetReps: 10 };
            await request.post(`/api/exercises/${exerciseId}/sets`).send(payload).expect(401);
        });

        it('should create a set for the authenticated user\'s exercise', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create full hierarchy
            const programResponse = await authHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await authHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await authHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await authHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await authHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const exerciseId = exerciseResponse.body.id;

            const payload: CreateSetDTO = { targetReps: 10, targetWeight: 100, targetRpe: 8 };
            const response = await authHelper.authenticatedPost(`/api/exercises/${exerciseId}/sets`, payload).expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.targetReps).toBe(10);
            expect(response.body.targetWeight).toBe(100);
            expect(response.body.exerciseId).toBe(exerciseId);

            const saved = await setRepo.findOneBy({ id: response.body.id });
            expect(saved).toBeTruthy();
            expect(saved!.exerciseId).toBe(exerciseId);
        });

        it('should prevent creating set for another user\'s exercise', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, { email: `first-${Date.now()}@example.com` });
            const programResponse = await firstAuthHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await firstAuthHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await firstAuthHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await firstAuthHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await firstAuthHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const exerciseId = exerciseResponse.body.id;

            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, { email: `second-${Date.now()}@example.com` });
            const response = await secondAuthHelper.authenticatedPost(`/api/exercises/${exerciseId}/sets`, { targetReps: 10 }).expect(403);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/exercises/:exerciseId/sets', () => {
        it('should require authentication', async () => {
            await request.get('/api/exercises/00000000-0000-0000-0000-000000000000/sets').expect(401);
        });

        it('should list sets with pagination', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const programResponse = await authHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await authHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await authHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await authHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await authHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const exerciseId = exerciseResponse.body.id;

            for (let i = 0; i < 3; i++) {
                await authHelper.authenticatedPost(`/api/exercises/${exerciseId}/sets`, { targetReps: i + 1 }).expect(201);
            }

            const response = await authHelper.authenticatedGet(`/api/exercises/${exerciseId}/sets?page=1&limit=10`).expect(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.length).toBe(3);
            expect(response.body.pagination.total).toBe(3);
        });
    });

    describe('GET /api/sets/:id', () => {
        it('should require authentication', async () => {
            await request.get('/api/sets/00000000-0000-0000-0000-000000000000').expect(401);
        });

        it('should fetch a set by id', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const programResponse = await authHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await authHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await authHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await authHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await authHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await authHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            const response = await authHelper.authenticatedGet(`/api/sets/${createResponse.body.id}`).expect(200);
            expect(response.body.id).toBe(createResponse.body.id);
            expect(response.body.targetReps).toBe(10);
        });

        it('should return 404 if set belongs to another user', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, { email: `first-${Date.now()}@example.com` });
            const programResponse = await firstAuthHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await firstAuthHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await firstAuthHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await firstAuthHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await firstAuthHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await firstAuthHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, { email: `second-${Date.now()}@example.com` });
            const response = await secondAuthHelper.authenticatedGet(`/api/sets/${createResponse.body.id}`).expect(404);
            expect(response.body).toHaveProperty('error', 'Set not found');
        });
    });

    describe('PATCH /api/sets/:id', () => {
        it('should require authentication', async () => {
            await request.patch('/api/sets/00000000-0000-0000-0000-000000000000').send({}).expect(401);
        });

        it('should update a set', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const programResponse = await authHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await authHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await authHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await authHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await authHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await authHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            const updateDto: UpdateSetDTO = { actualReps: 12, actualWeight: 105, completed: true };
            const response = await authHelper.authenticatedPatch(`/api/sets/${createResponse.body.id}`, updateDto).expect(200);

            expect(response.body.actualReps).toBe(12);
            expect(response.body.actualWeight).toBe(105);
            expect(response.body.completed).toBe(true);

            const updated = await setRepo.findOneBy({ id: createResponse.body.id });
            expect(updated!.actualReps).toBe(12);
            expect(updated!.completed).toBe(true);
        });

        it('should prevent updating another user\'s set', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, { email: `first-${Date.now()}@example.com` });
            const programResponse = await firstAuthHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await firstAuthHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await firstAuthHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await firstAuthHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await firstAuthHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await firstAuthHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, { email: `second-${Date.now()}@example.com` });
            const response = await secondAuthHelper.authenticatedPatch(`/api/sets/${createResponse.body.id}`, { actualReps: 15 }).expect(404);
            expect(response.body).toHaveProperty('error', 'Set not found');

            const set = await setRepo.findOneBy({ id: createResponse.body.id });
            expect(set!.actualReps).toBeNull();
        });

        it('should toggle completion false->true->false', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const programResponse = await authHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await authHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await authHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await authHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await authHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await authHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            const setId = createResponse.body.id;
            expect(createResponse.body.completed).toBe(false);

            const toTrue = await authHelper.authenticatedPatch(`/api/sets/${setId}`, { completed: true }).expect(200);
            expect(toTrue.body.completed).toBe(true);

            const toFalse = await authHelper.authenticatedPatch(`/api/sets/${setId}`, { completed: false }).expect(200);
            expect(toFalse.body.completed).toBe(false);
        });
    });

    describe('DELETE /api/sets/:id', () => {
        it('should require authentication', async () => {
            await request.delete('/api/sets/00000000-0000-0000-0000-000000000000').expect(401);
        });

        it('should soft delete a set', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const programResponse = await authHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await authHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await authHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await authHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await authHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await authHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            await authHelper.authenticatedDelete(`/api/sets/${createResponse.body.id}`).expect(204);

            const deletedSet = await setRepo.findOne({ where: { id: createResponse.body.id }, withDeleted: true });
            expect(deletedSet).toBeTruthy();
            expect(deletedSet!.deletedAt).toBeTruthy();

            const normalQuery = await setRepo.findOneBy({ id: createResponse.body.id });
            expect(normalQuery).toBeNull();
        });

        it('should prevent deleting another user\'s set', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, { email: `first-${Date.now()}@example.com` });
            const programResponse = await firstAuthHelper.authenticatedPost('/api/programs', { name: 'Program' }).expect(201);
            const cycleResponse = await firstAuthHelper.authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' }).expect(201);
            const blockResponse = await firstAuthHelper.authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' }).expect(201);
            const sessionResponse = await firstAuthHelper.authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' }).expect(201);
            const exerciseResponse = await firstAuthHelper.authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Exercise' }).expect(201);
            const createResponse = await firstAuthHelper.authenticatedPost(`/api/exercises/${exerciseResponse.body.id}/sets`, { targetReps: 10 }).expect(201);

            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, { email: `second-${Date.now()}@example.com` });
            const response = await secondAuthHelper.authenticatedDelete(`/api/sets/${createResponse.body.id}`).expect(404);
            expect(response.body).toHaveProperty('error', 'Set not found');

            const set = await setRepo.findOneBy({ id: createResponse.body.id });
            expect(set).toBeTruthy();
            expect(set!.deletedAt).toBeNull();
        });
    });
});
