import { CreateExerciseDTO, UpdateExerciseDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { Exercise } from '../../../entity/exercise';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('Exercise API', () => {
    let exerciseRepo: Repository<Exercise>;

    beforeAll(async () => {
        exerciseRepo = testDataSource.getRepository(Exercise);
    });

    describe('POST /api/sessions/:sessionId/exercises', () => {
        it('should require authentication', async () => {
            const sessionId = '00000000-0000-0000-0000-000000000000';
            const payload: CreateExerciseDTO = { name: 'Test Exercise' };
            await request.post(`/api/sessions/${sessionId}/exercises`).send(payload).expect(401);
        });

        it('should create an exercise for the authenticated user\'s session', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create program, cycle, block, and session first
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Parent Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Parent Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Parent Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Parent Session' })
                .expect(201);
            const sessionId = sessionResponse.body.id;

            const payload: CreateExerciseDTO = {
                name: 'Bench Press',
                description: 'Barbell flat bench press'
            };

            const response = await authHelper
                .authenticatedPost(`/api/sessions/${sessionId}/exercises`, payload)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(payload.name);
            expect(response.body.description).toBe(payload.description);
            expect(response.body.sessionId).toBe(sessionId);

            // Verify in database
            const saved = await exerciseRepo.findOneBy({ id: response.body.id });
            expect(saved).toBeTruthy();
            expect(saved!.sessionId).toBe(sessionId);
        });

        it('should validate exercise creation payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Test Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Test Session' })
                .expect(201);

            const response = await authHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { description: 'No name' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors).toHaveProperty('name');
        });

        it('should prevent creating exercise for another user\'s session', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'First User Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'First User Cycle' })
                .expect(201);

            const blockResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'First User Block' })
                .expect(201);

            const sessionResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'First User Session' })
                .expect(201);
            const sessionId = sessionResponse.body.id;

            // Try to create exercise with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPost(`/api/sessions/${sessionId}/exercises`, { name: 'Unauthorized Exercise' })
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 404 for non-existent session', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPost(`/api/sessions/${nonExistentId}/exercises`, { name: 'Test Exercise' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/sessions/:sessionId/exercises', () => {
        it('should require authentication', async () => {
            const sessionId = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/sessions/${sessionId}/exercises`).expect(401);
        });

        it('should list exercises only for the authenticated user\'s session with pagination', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create program, cycle, block, and session
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Program with Exercises' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle with Exercises' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block with Exercises' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session with Exercises' })
                .expect(201);
            const sessionId = sessionResponse.body.id;

            // Create 3 exercises for this session
            const exerciseNames: string[] = [];
            for (let i = 0; i < 3; i++) {
                const name = `Exercise ${Date.now()}-${i}`;
                exerciseNames.push(name);
                await authHelper
                    .authenticatedPost(`/api/sessions/${sessionId}/exercises`, { name })
                    .expect(201);
            }

            // List exercises for the session
            const response = await authHelper
                .authenticatedGet(`/api/sessions/${sessionId}/exercises?page=1&limit=10`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should have 3 exercises
            expect(response.body.data.length).toBe(3);

            // All exercises should belong to this session
            for (const exercise of response.body.data) {
                expect(exercise.sessionId).toBe(sessionId);
            }

            // Should contain the exercises we created
            const returnedNames = response.body.data.map((e: any) => e.name);
            for (const name of exerciseNames) {
                expect(returnedNames).toContain(name);
            }

            // Verify pagination metadata
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total', 3);
            expect(response.body.pagination).toHaveProperty('totalPages', 1);
        });

        it('should prevent accessing another user\'s session exercises', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Private Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Private Cycle' })
                .expect(201);

            const blockResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Private Block' })
                .expect(201);

            const sessionResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Private Session' })
                .expect(201);
            const sessionId = sessionResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/sessions/${sessionId}/exercises`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/exercises/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/exercises/${uuid}`).expect(401);
        });

        it('should fetch an exercise by id if it belongs to the user', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Test Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Test Session' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, {
                    name: 'Fetch Me',
                    description: 'Test description'
                })
                .expect(201);

            const exerciseId = createResponse.body.id;

            const response = await authHelper
                .authenticatedGet(`/api/exercises/${exerciseId}`)
                .expect(200);

            expect(response.body.id).toBe(exerciseId);
            expect(response.body.name).toBe('Fetch Me');
            expect(response.body.description).toBe('Test description');
        });

        it('should return 404 if exercise does not exist', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedGet(`/api/exercises/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Exercise not found');
        });

        it('should return 404 if exercise belongs to another user', async () => {
            // Create exercise with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' })
                .expect(201);

            const blockResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' })
                .expect(201);

            const sessionResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Private Exercise' })
                .expect(201);

            const exerciseId = createResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/exercises/${exerciseId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Exercise not found');
        });
    });

    describe('PATCH /api/exercises/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.patch(`/api/exercises/${uuid}`).send({}).expect(401);
        });

        it('should update an exercise', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Test Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Test Session' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, {
                    name: 'Original Name',
                    description: 'Original description'
                })
                .expect(201);

            const exerciseId = createResponse.body.id;

            const updateDto: UpdateExerciseDTO = {
                name: 'Updated Name',
                description: 'Updated description',
                completed: true
            };

            const response = await authHelper
                .authenticatedPatch(`/api/exercises/${exerciseId}`, updateDto)
                .expect(200);

            expect(response.body.name).toBe('Updated Name');
            expect(response.body.description).toBe('Updated description');
            expect(response.body.completed).toBe(true);

            // Verify in database
            const updated = await exerciseRepo.findOneBy({ id: exerciseId });
            expect(updated!.name).toBe('Updated Name');
            expect(updated!.completed).toBe(true);
        });

        it('should toggle completion false->true->false', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Test Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Test Session' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Toggle Exercise' })
                .expect(201);

            const exerciseId = createResponse.body.id;
            expect(createResponse.body.completed).toBe(false);

            const toTrue = await authHelper
                .authenticatedPatch(`/api/exercises/${exerciseId}`, { completed: true })
                .expect(200);
            expect(toTrue.body.completed).toBe(true);

            const toFalse = await authHelper
                .authenticatedPatch(`/api/exercises/${exerciseId}`, { completed: false })
                .expect(200);
            expect(toFalse.body.completed).toBe(false);
        });

        it('should return 404 when updating non-existent exercise', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPatch(`/api/exercises/${nonExistentId}`, { name: 'Nope' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Exercise not found');
        });

        it('should prevent updating another user\'s exercise', async () => {
            // Create exercise with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' })
                .expect(201);

            const blockResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' })
                .expect(201);

            const sessionResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Protected Exercise' })
                .expect(201);

            const exerciseId = createResponse.body.id;

            // Try to update with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPatch(`/api/exercises/${exerciseId}`, { name: 'Hacked' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Exercise not found');

            // Verify exercise was not modified
            const exercise = await exerciseRepo.findOneBy({ id: exerciseId });
            expect(exercise!.name).toBe('Protected Exercise');
        });

        it('should validate update payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Test Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Test Session' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Validation Test' })
                .expect(201);

            const exerciseId = createResponse.body.id;

            const response = await authHelper
                .authenticatedPatch(`/api/exercises/${exerciseId}`, { completed: 'yes' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors.completed).toBeDefined();
        });
    });

    describe('DELETE /api/exercises/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.delete(`/api/exercises/${uuid}`).expect(401);
        });

        it('should soft delete an exercise', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Test Block' })
                .expect(201);

            const sessionResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Test Session' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'To Delete' })
                .expect(201);

            const exerciseId = createResponse.body.id;

            await authHelper
                .authenticatedDelete(`/api/exercises/${exerciseId}`)
                .expect(204);

            // Verify exercise was soft deleted
            const deletedExercise = await exerciseRepo.findOne({
                where: { id: exerciseId },
                withDeleted: true
            });

            expect(deletedExercise).toBeTruthy();
            expect(deletedExercise!.deletedAt).toBeTruthy();

            // Verify exercise doesn't appear in normal queries
            const normalQuery = await exerciseRepo.findOneBy({ id: exerciseId });
            expect(normalQuery).toBeNull();
        });

        it('should return 404 when deleting non-existent exercise', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedDelete(`/api/exercises/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Exercise not found');
        });

        it('should prevent deleting another user\'s exercise', async () => {
            // Create exercise with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' })
                .expect(201);

            const blockResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block' })
                .expect(201);

            const sessionResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Session' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/sessions/${sessionResponse.body.id}/exercises`, { name: 'Protected Exercise' })
                .expect(201);

            const exerciseId = createResponse.body.id;

            // Try to delete with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedDelete(`/api/exercises/${exerciseId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Exercise not found');

            // Verify exercise was not deleted
            const exercise = await exerciseRepo.findOneBy({ id: exerciseId });
            expect(exercise).toBeTruthy();
            expect(exercise!.deletedAt).toBeNull();
        });
    });
});
