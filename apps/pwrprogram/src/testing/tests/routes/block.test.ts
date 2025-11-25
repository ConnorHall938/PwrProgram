import { CreateBlockDTO, UpdateBlockDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { Block } from '../../../entity/block';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('Block API', () => {
    let blockRepo: Repository<Block>;

    beforeAll(async () => {
        blockRepo = testDataSource.getRepository(Block);
    });

    describe('POST /api/cycles/:cycleId/blocks', () => {
        it('should require authentication', async () => {
            const cycleId = '00000000-0000-0000-0000-000000000000';
            const payload: CreateBlockDTO = { name: 'Test Block' };
            await request.post(`/api/cycles/${cycleId}/blocks`).send(payload).expect(401);
        });

        it('should create a block for the authenticated user\'s cycle', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create program and cycle first
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Parent Program' })
                .expect(201);
            const programId = programResponse.body.id;

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programId}/cycles`, { name: 'Parent Cycle' })
                .expect(201);
            const cycleId = cycleResponse.body.id;

            const payload: CreateBlockDTO = {
                name: 'Base Block',
                description: 'Hypertrophy phase',
                goals: ['Build size', 'Increase volume'],
                sessionsPerWeek: 4
            };

            const response = await authHelper
                .authenticatedPost(`/api/cycles/${cycleId}/blocks`, payload)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(payload.name);
            expect(response.body.description).toBe(payload.description);
            expect(response.body.cycleId).toBe(cycleId);
            expect(response.body.goals).toEqual(payload.goals);
            expect(response.body.sessionsPerWeek).toBe(4);

            // Verify in database
            const saved = await blockRepo.findOneBy({ id: response.body.id });
            expect(saved).toBeTruthy();
            expect(saved!.cycleId).toBe(cycleId);
        });

        it('should validate block creation payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);
            const cycleId = cycleResponse.body.id;

            const response = await authHelper
                .authenticatedPost(`/api/cycles/${cycleId}/blocks`, { description: 'No name' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors).toHaveProperty('name');
        });

        it('should reject invalid sessionsPerWeek (<1)', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const response = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, {
                    name: 'Bad Sessions',
                    sessionsPerWeek: 0
                })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors.sessionsPerWeek).toBeDefined();
        });

        it('should prevent creating block for another user\'s cycle', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'First User Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'First User Cycle' })
                .expect(201);
            const cycleId = cycleResponse.body.id;

            // Try to create block with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPost(`/api/cycles/${cycleId}/blocks`, { name: 'Unauthorized Block' })
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 404 for non-existent cycle', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPost(`/api/cycles/${nonExistentId}/blocks`, { name: 'Test Block' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/cycles/:cycleId/blocks', () => {
        it('should require authentication', async () => {
            const cycleId = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/cycles/${cycleId}/blocks`).expect(401);
        });

        it('should list blocks only for the authenticated user\'s cycle with pagination', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create program and cycle
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Program with Blocks' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle with Blocks' })
                .expect(201);
            const cycleId = cycleResponse.body.id;

            // Create 3 blocks for this cycle
            const blockNames: string[] = [];
            for (let i = 0; i < 3; i++) {
                const name = `Block ${Date.now()}-${i}`;
                blockNames.push(name);
                await authHelper
                    .authenticatedPost(`/api/cycles/${cycleId}/blocks`, { name })
                    .expect(201);
            }

            // List blocks for the cycle
            const response = await authHelper
                .authenticatedGet(`/api/cycles/${cycleId}/blocks?page=1&limit=10`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should have 3 blocks
            expect(response.body.data.length).toBe(3);

            // All blocks should belong to this cycle
            for (const block of response.body.data) {
                expect(block.cycleId).toBe(cycleId);
            }

            // Should contain the blocks we created
            const returnedNames = response.body.data.map((b: any) => b.name);
            for (const name of blockNames) {
                expect(returnedNames).toContain(name);
            }

            // Verify pagination metadata
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total', 3);
            expect(response.body.pagination).toHaveProperty('totalPages', 1);
        });

        it('should prevent accessing another user\'s cycle blocks', async () => {
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Private Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Private Cycle' })
                .expect(201);
            const cycleId = cycleResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/cycles/${cycleId}/blocks`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/blocks/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/blocks/${uuid}`).expect(401);
        });

        it('should fetch a block by id if it belongs to the user', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, {
                    name: 'Fetch Me',
                    description: 'Test description',
                    sessionsPerWeek: 5
                })
                .expect(201);

            const blockId = createResponse.body.id;

            const response = await authHelper
                .authenticatedGet(`/api/blocks/${blockId}`)
                .expect(200);

            expect(response.body.id).toBe(blockId);
            expect(response.body.name).toBe('Fetch Me');
            expect(response.body.description).toBe('Test description');
            expect(response.body.sessionsPerWeek).toBe(5);
        });

        it('should return 404 if block does not exist', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedGet(`/api/blocks/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Block not found');
        });

        it('should return 404 if block belongs to another user', async () => {
            // Create block with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Private Block' })
                .expect(201);

            const blockId = createResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/blocks/${blockId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Block not found');
        });
    });

    describe('PATCH /api/blocks/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.patch(`/api/blocks/${uuid}`).send({}).expect(401);
        });

        it('should update a block', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, {
                    name: 'Original Name',
                    description: 'Original description',
                    sessionsPerWeek: 4
                })
                .expect(201);

            const blockId = createResponse.body.id;

            const updateDto: UpdateBlockDTO = {
                name: 'Updated Name',
                description: 'Updated description',
                sessionsPerWeek: 5,
                completed: true
            };

            const response = await authHelper
                .authenticatedPatch(`/api/blocks/${blockId}`, updateDto)
                .expect(200);

            expect(response.body.name).toBe('Updated Name');
            expect(response.body.description).toBe('Updated description');
            expect(response.body.sessionsPerWeek).toBe(5);
            expect(response.body.completed).toBe(true);

            // Verify in database
            const updated = await blockRepo.findOneBy({ id: blockId });
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

            const createResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Toggle Block' })
                .expect(201);

            const blockId = createResponse.body.id;
            expect(createResponse.body.completed).toBe(false);

            const toTrue = await authHelper
                .authenticatedPatch(`/api/blocks/${blockId}`, { completed: true })
                .expect(200);
            expect(toTrue.body.completed).toBe(true);

            const toFalse = await authHelper
                .authenticatedPatch(`/api/blocks/${blockId}`, { completed: false })
                .expect(200);
            expect(toFalse.body.completed).toBe(false);
        });

        it('should return 404 when updating non-existent block', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPatch(`/api/blocks/${nonExistentId}`, { name: 'Nope' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Block not found');
        });

        it('should prevent updating another user\'s block', async () => {
            // Create block with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Protected Block' })
                .expect(201);

            const blockId = createResponse.body.id;

            // Try to update with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPatch(`/api/blocks/${blockId}`, { name: 'Hacked' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Block not found');

            // Verify block was not modified
            const block = await blockRepo.findOneBy({ id: blockId });
            expect(block!.name).toBe('Protected Block');
        });

        it('should validate update payload', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Validation Test' })
                .expect(201);

            const blockId = createResponse.body.id;

            const response = await authHelper
                .authenticatedPatch(`/api/blocks/${blockId}`, { completed: 'yes' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors.completed).toBeDefined();
        });
    });

    describe('DELETE /api/blocks/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.delete(`/api/blocks/${uuid}`).expect(401);
        });

        it('should soft delete a block', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Test Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Test Cycle' })
                .expect(201);

            const createResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'To Delete' })
                .expect(201);

            const blockId = createResponse.body.id;

            await authHelper
                .authenticatedDelete(`/api/blocks/${blockId}`)
                .expect(204);

            // Verify block was soft deleted
            const deletedBlock = await blockRepo.findOne({
                where: { id: blockId },
                withDeleted: true
            });

            expect(deletedBlock).toBeTruthy();
            expect(deletedBlock!.deletedAt).toBeTruthy();

            // Verify block doesn't appear in normal queries
            const normalQuery = await blockRepo.findOneBy({ id: blockId });
            expect(normalQuery).toBeNull();
        });

        it('should return 404 when deleting non-existent block', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedDelete(`/api/blocks/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Block not found');
        });

        it('should prevent deleting another user\'s block', async () => {
            // Create block with first user
            const { authHelper: firstAuthHelper } = await createAuthenticatedSession(app, {
                email: `first-${Date.now()}@example.com`
            });

            const programResponse = await firstAuthHelper
                .authenticatedPost('/api/programs', { name: 'Program' })
                .expect(201);

            const cycleResponse = await firstAuthHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle' })
                .expect(201);

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Protected Block' })
                .expect(201);

            const blockId = createResponse.body.id;

            // Try to delete with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedDelete(`/api/blocks/${blockId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Block not found');

            // Verify block was not deleted
            const block = await blockRepo.findOneBy({ id: blockId });
            expect(block).toBeTruthy();
            expect(block!.deletedAt).toBeNull();
        });
    });
});
