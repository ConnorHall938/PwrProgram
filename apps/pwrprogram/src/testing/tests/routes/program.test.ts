import { CreateProgramDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { Program } from '../../../entity/program';
import { User } from '../../../entity/User';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('Program API', () => {
    let userRepo: Repository<User>;
    let programRepo: Repository<Program>;

    beforeAll(async () => {
        userRepo = testDataSource.getRepository(User);
        programRepo = testDataSource.getRepository(Program);
    });

    describe('POST /api/programs', () => {
        it('should require authentication', async () => {
            const payload: CreateProgramDTO = { name: 'Test Program' };
            await request.post('/api/programs').send(payload).expect(401);
        });

        it('should create a program for the authenticated user', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const payload: CreateProgramDTO = {
                name: 'Strength Base',
                description: 'Base phase training'
            };

            const response = await authHelper
                .authenticatedPost('/api/programs', payload)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(payload.name);
            expect(response.body.description).toBe(payload.description);
            expect(response.body.userId).toBe(user.id);

            // Verify in database
            const saved = await programRepo.findOneBy({ id: response.body.id });
            expect(saved).toBeTruthy();
            expect(saved!.userId).toBe(user.id);
        });

        it('should validate program creation payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const response = await authHelper
                .authenticatedPost('/api/programs', { description: 'No name' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors).toHaveProperty('name');
        });

        it('should allow creating program without description', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const payload: CreateProgramDTO = {
                name: 'Minimal Program'
            };

            const response = await authHelper
                .authenticatedPost('/api/programs', payload)
                .expect(201);

            expect(response.body.name).toBe(payload.name);
            expect(response.body.userId).toBe(user.id);
        });
    });

    describe('GET /api/programs', () => {
        it('should require authentication', async () => {
            await request.get('/api/programs').expect(401);
        });

        it('should list programs only for the authenticated user with pagination', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            // Create 3 programs for this user
            const programNames: string[] = [];
            for (let i = 0; i < 3; i++) {
                const name = `Program ${Date.now()}-${i}`;
                programNames.push(name);
                await authHelper.authenticatedPost('/api/programs', { name }).expect(201);
            }

            // Create a program for a different user
            const { authHelper: otherAuthHelper } = await createAuthenticatedSession(app, {
                email: `other-${Date.now()}@example.com`
            });
            await otherAuthHelper.authenticatedPost('/api/programs', {
                name: 'Other User Program'
            }).expect(201);

            // List programs for first user
            const response = await authHelper
                .authenticatedGet('/api/programs?page=1&limit=10')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should have at least 3 programs
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);

            // All programs should belong to this user
            for (const program of response.body.data) {
                expect(program.userId).toBe(user.id);
            }

            // Should contain the programs we created
            const returnedNames = response.body.data.map((p: any) => p.name);
            for (const name of programNames) {
                expect(returnedNames).toContain(name);
            }

            // Should NOT contain the other user's program
            expect(returnedNames).not.toContain('Other User Program');

            // Verify pagination metadata
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('totalPages');
        });

        it('should respect pagination limits', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create several programs
            for (let i = 0; i < 5; i++) {
                await authHelper.authenticatedPost('/api/programs', {
                    name: `Paginated Program ${i}`
                }).expect(201);
            }

            const response = await authHelper
                .authenticatedGet('/api/programs?page=1&limit=2')
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination.limit).toBe(2);
        });

        it('should return empty array if user has no programs', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const response = await authHelper
                .authenticatedGet('/api/programs')
                .expect(200);

            expect(response.body.data).toEqual([]);
            expect(response.body.pagination.total).toBe(0);
        });
    });

    describe('GET /api/programs/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/programs/${uuid}`).expect(401);
        });

        it('should fetch a program by id if it belongs to the user', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const createResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Fetch Me', description: 'Test description' })
                .expect(201);

            const programId = createResponse.body.id;

            const response = await authHelper
                .authenticatedGet(`/api/programs/${programId}`)
                .expect(200);

            expect(response.body.id).toBe(programId);
            expect(response.body.name).toBe('Fetch Me');
            expect(response.body.description).toBe('Test description');
            expect(response.body.userId).toBe(user.id);
        });

        it('should return 404 if program does not exist', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedGet(`/api/programs/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Program not found');
        });

        it('should return 404 if program belongs to another user', async () => {
            // Create program with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const createResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Private Program' })
                .expect(201);

            const programId = createResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/programs/${programId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Program not found');
        });
    });

    describe('DELETE /api/programs/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.delete(`/api/programs/${uuid}`).expect(401);
        });

        it('should soft delete a program', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const createResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'To Delete' })
                .expect(201);

            const programId = createResponse.body.id;

            await authHelper
                .authenticatedDelete(`/api/programs/${programId}`)
                .expect(204);

            // Verify program was soft deleted
            const deletedProgram = await programRepo.findOne({
                where: { id: programId },
                withDeleted: true
            });

            expect(deletedProgram).toBeTruthy();
            expect(deletedProgram!.deletedAt).toBeTruthy();

            // Verify program doesn't appear in normal queries
            const normalQuery = await programRepo.findOneBy({ id: programId });
            expect(normalQuery).toBeNull();

            // Verify it doesn't appear in GET list
            const listResponse = await authHelper
                .authenticatedGet('/api/programs')
                .expect(200);

            const programIds = listResponse.body.data.map((p: any) => p.id);
            expect(programIds).not.toContain(programId);
        });

        it('should return 404 when deleting non-existent program', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedDelete(`/api/programs/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Program not found');
        });

        it('should return 404 when trying to delete another user\'s program', async () => {
            // Create program with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const createResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Protected Program' })
                .expect(201);

            const programId = createResponse.body.id;

            // Try to delete with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedDelete(`/api/programs/${programId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Program not found');

            // Verify program was not deleted
            const program = await programRepo.findOneBy({ id: programId });
            expect(program).toBeTruthy();
            expect(program!.deletedAt).toBeNull();
        });
    });
});
