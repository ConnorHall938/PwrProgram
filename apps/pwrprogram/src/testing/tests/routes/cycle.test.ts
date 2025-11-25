import { CreateCycleDTO, UpdateCycleDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { Cycle } from '../../../entity/cycle';
import { Program } from '../../../entity/program';
import { User } from '../../../entity/User';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('Cycle API', () => {
    let cycleRepo: Repository<Cycle>;
    let programRepo: Repository<Program>;

    beforeAll(async () => {
        cycleRepo = testDataSource.getRepository(Cycle);
        programRepo = testDataSource.getRepository(Program);
    });

    describe('POST /api/programs/:programId/cycles', () => {
        it('should require authentication', async () => {
            const programId = '00000000-0000-0000-0000-000000000000';
            const payload: CreateCycleDTO = { name: 'Test Cycle' };
            await request.post(`/api/programs/${programId}/cycles`).send(payload).expect(401);
        });

        it('should create a cycle for the authenticated user\'s program', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            // Create a program first
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Parent Program' })
                .expect(201);
            const programId = programResponse.body.id;

            const payload: CreateCycleDTO = {
                name: 'Base Cycle',
                description: 'Intro phase',
                goals: ['Adapt', 'Build base']
            };

            const response = await authHelper
                .authenticatedPost(`/api/programs/${programId}/cycles`, payload)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(payload.name);
            expect(response.body.description).toBe(payload.description);
            expect(response.body.programId).toBe(programId);
            expect(response.body.goals).toEqual(payload.goals);

            // Verify in database
            const saved = await cycleRepo.findOneBy({ id: response.body.id });
            expect(saved).toBeTruthy();
            expect(saved!.programId).toBe(programId);
        });

        it('should validate cycle creation payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);
            const programId = programResponse.body.id;

            const response = await authHelper
                .authenticatedPost(`/api/programs/${programId}/cycles`, { description: 'No name' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors).toHaveProperty('name');
        });

        it('should prevent creating cycle for another user\'s program', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'First User Program' })
                .expect(201);
            const programId = programResponse.body.id;

            // Try to create cycle with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPost(`/api/programs/${programId}/cycles`, { name: 'Unauthorized Cycle' })
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 404 for non-existent program', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPost(`/api/programs/${nonExistentId}/cycles`, { name: 'Test Cycle' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/programs/:programId/cycles', () => {
        it('should require authentication', async () => {
            const programId = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/programs/${programId}/cycles`).expect(401);
        });

        it('should list cycles only for the authenticated user\'s program with pagination', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            // Create a program
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Program with Cycles' })
                .expect(201);
            const programId = programResponse.body.id;

            // Create 3 cycles for this program
            const cycleNames: string[] = [];
            for (let i = 0; i < 3; i++) {
                const name = `Cycle ${Date.now()}-${i}`;
                cycleNames.push(name);
                await authHelper
                    .authenticatedPost(`/api/programs/${programId}/cycles`, { name })
                    .expect(201);
            }

            // List cycles for the program
            const response = await authHelper
                .authenticatedGet(`/api/programs/${programId}/cycles?page=1&limit=10`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should have 3 cycles
            expect(response.body.data.length).toBe(3);

            // All cycles should belong to this program
            for (const cycle of response.body.data) {
                expect(cycle.programId).toBe(programId);
            }

            // Should contain the cycles we created
            const returnedNames = response.body.data.map((c: any) => c.name);
            for (const name of cycleNames) {
                expect(returnedNames).toContain(name);
            }

            // Verify pagination metadata
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total', 3);
            expect(response.body.pagination).toHaveProperty('totalPages', 1);
        });

        it('should prevent accessing another user\'s program cycles', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Private Program' })
                .expect(201);
            const programId = programResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/programs/${programId}/cycles`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/cycles/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/cycles/${uuid}`).expect(401);
        });

        it('should fetch a cycle by id if it belongs to the user', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);
            const programId = programResponse.body.id;

            const createResponse = await authHelper
                .authenticatedPost(`/api/programs/${programId}/cycles`, {
                    name: 'Fetch Me',
                    description: 'Test description'
                })
                .expect(201);

            const cycleId = createResponse.body.id;

            const response = await authHelper
                .authenticatedGet(`/api/cycles/${cycleId}`)
                .expect(200);

            expect(response.body.id).toBe(cycleId);
            expect(response.body.name).toBe('Fetch Me');
            expect(response.body.description).toBe('Test description');
            expect(response.body.programId).toBe(programId);
        });

        it('should return 404 if cycle does not exist', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedGet(`/api/cycles/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Cycle not found');
        });

        it('should return 404 if cycle belongs to another user', async () => {
            // Create cycle with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Private Cycle' })
                .expect(201);

            const cycleId = createResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/cycles/${cycleId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Cycle not found');
        });
    });

    describe('PATCH /api/cycles/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.patch(`/api/cycles/${uuid}`).send({}).expect(401);
        });

        it('should update a cycle', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, {
                    name: 'Original Name',
                    description: 'Original description'
                })
                .expect(201);

            const cycleId = createResponse.body.id;

            const updateDto: UpdateCycleDTO = {
                name: 'Updated Name',
                description: 'Updated description',
                completed: true
            };

            const response = await authHelper
                .authenticatedPatch(`/api/cycles/${cycleId}`, updateDto)
                .expect(200);

            expect(response.body.name).toBe('Updated Name');
            expect(response.body.description).toBe('Updated description');
            expect(response.body.completed).toBe(true);

            // Verify in database
            const updated = await cycleRepo.findOneBy({ id: cycleId });
            expect(updated!.name).toBe('Updated Name');
            expect(updated!.completed).toBe(true);
        });

        it('should toggle completion false->true->false', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Toggle Cycle' })
                .expect(201);

            const cycleId = createResponse.body.id;
            expect(createResponse.body.completed).toBe(false);

            const toTrue = await authHelper
                .authenticatedPatch(`/api/cycles/${cycleId}`, { completed: true })
                .expect(200);
            expect(toTrue.body.completed).toBe(true);

            const toFalse = await authHelper
                .authenticatedPatch(`/api/cycles/${cycleId}`, { completed: false })
                .expect(200);
            expect(toFalse.body.completed).toBe(false);
        });

        it('should return 404 when updating non-existent cycle', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPatch(`/api/cycles/${nonExistentId}`, { name: 'Nope' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Cycle not found');
        });

        it('should prevent updating another user\'s cycle', async () => {
            // Create cycle with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Protected Cycle' })
                .expect(201);

            const cycleId = createResponse.body.id;

            // Try to update with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPatch(`/api/cycles/${cycleId}`, { name: 'Hacked' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Cycle not found');

            // Verify cycle was not modified
            const cycle = await cycleRepo.findOneBy({ id: cycleId });
            expect(cycle!.name).toBe('Protected Cycle');
        });

        it('should validate update payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Validation Test' })
                .expect(201);

            const cycleId = createResponse.body.id;

            const response = await authHelper
                .authenticatedPatch(`/api/cycles/${cycleId}`, { completed: 'yes' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors.completed).toBeDefined();
        });
    });

    describe('DELETE /api/cycles/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.delete(`/api/cycles/${uuid}`).expect(401);
        });

        it('should soft delete a cycle', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'To Delete' })
                .expect(201);

            const cycleId = createResponse.body.id;

            await authHelper
                .authenticatedDelete(`/api/cycles/${cycleId}`)
                .expect(204);

            // Verify cycle was soft deleted
            const deletedCycle = await cycleRepo.findOne({
                where: { id: cycleId },
                withDeleted: true
            });

            expect(deletedCycle).toBeTruthy();
            expect(deletedCycle!.deletedAt).toBeTruthy();

            // Verify cycle doesn't appear in normal queries
            const normalQuery = await cycleRepo.findOneBy({ id: cycleId });
            expect(normalQuery).toBeNull();
        });

        it('should return 404 when deleting non-existent cycle', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedDelete(`/api/cycles/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Cycle not found');
        });

        it('should prevent deleting another user\'s cycle', async () => {
            // Create cycle with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Protected Cycle' })
                .expect(201);

            const cycleId = createResponse.body.id;

            // Try to delete with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedDelete(`/api/cycles/${cycleId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Cycle not found');

            // Verify cycle was not deleted
            const cycle = await cycleRepo.findOneBy({ id: cycleId });
            expect(cycle).toBeTruthy();
            expect(cycle!.deletedAt).toBeNull();
        });
    });
});
