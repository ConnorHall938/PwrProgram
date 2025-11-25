import { CreateSessionDTO, UpdateSessionDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { Session } from '../../../entity/session';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('Session API', () => {
    let sessionRepo: Repository<Session>;

    beforeAll(async () => {
        sessionRepo = testDataSource.getRepository(Session);
    });

    describe('POST /api/blocks/:blockId/sessions', () => {
        it('should require authentication', async () => {
            const blockId = '00000000-0000-0000-0000-000000000000';
            const payload: CreateSessionDTO = { name: 'Test Session' };
            await request.post(`/api/blocks/${blockId}/sessions`).send(payload).expect(401);
        });

        it('should create a session for the authenticated user\'s block', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create program, cycle, and block first
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Parent Program' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Parent Cycle' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Parent Block' })
                .expect(201);
            const blockId = blockResponse.body.id;

            const payload: CreateSessionDTO = {
                name: 'Day 1',
                description: 'Upper body workout'
            };

            const response = await authHelper
                .authenticatedPost(`/api/blocks/${blockId}/sessions`, payload)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(payload.name);
            expect(response.body.description).toBe(payload.description);
            expect(response.body.blockId).toBe(blockId);

            // Verify in database
            const saved = await sessionRepo.findOneBy({ id: response.body.id });
            expect(saved).toBeTruthy();
            expect(saved!.blockId).toBe(blockId);
        });

        it('should validate session creation payload', async () => {
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

            const response = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { description: 'No name' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors).toHaveProperty('name');
        });

        it('should prevent creating session for another user\'s block', async () => {
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
            const blockId = blockResponse.body.id;

            // Try to create session with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPost(`/api/blocks/${blockId}/sessions`, { name: 'Unauthorized Session' })
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 404 for non-existent block', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPost(`/api/blocks/${nonExistentId}/sessions`, { name: 'Test Session' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/blocks/:blockId/sessions', () => {
        it('should require authentication', async () => {
            const blockId = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/blocks/${blockId}/sessions`).expect(401);
        });

        it('should list sessions only for the authenticated user\'s block with pagination', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create program, cycle, and block
            const programResponse = await authHelper
                .authenticatedPost('/api/programs', { name: 'Program with Sessions' })
                .expect(201);

            const cycleResponse = await authHelper
                .authenticatedPost(`/api/programs/${programResponse.body.id}/cycles`, { name: 'Cycle with Sessions' })
                .expect(201);

            const blockResponse = await authHelper
                .authenticatedPost(`/api/cycles/${cycleResponse.body.id}/blocks`, { name: 'Block with Sessions' })
                .expect(201);
            const blockId = blockResponse.body.id;

            // Create 3 sessions for this block
            const sessionNames: string[] = [];
            for (let i = 0; i < 3; i++) {
                const name = `Session ${Date.now()}-${i}`;
                sessionNames.push(name);
                await authHelper
                    .authenticatedPost(`/api/blocks/${blockId}/sessions`, { name })
                    .expect(201);
            }

            // List sessions for the block
            const response = await authHelper
                .authenticatedGet(`/api/blocks/${blockId}/sessions?page=1&limit=10`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should have 3 sessions
            expect(response.body.data.length).toBe(3);

            // All sessions should belong to this block
            for (const session of response.body.data) {
                expect(session.blockId).toBe(blockId);
            }

            // Should contain the sessions we created
            const returnedNames = response.body.data.map((s: any) => s.name);
            for (const name of sessionNames) {
                expect(returnedNames).toContain(name);
            }

            // Verify pagination metadata
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total', 3);
            expect(response.body.pagination).toHaveProperty('totalPages', 1);
        });

        it('should prevent accessing another user\'s block sessions', async () => {
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
            const blockId = blockResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/blocks/${blockId}/sessions`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/sessions/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/sessions/${uuid}`).expect(401);
        });

        it('should fetch a session by id if it belongs to the user', async () => {
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

            const createResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, {
                    name: 'Fetch Me',
                    description: 'Test description'
                })
                .expect(201);

            const sessionId = createResponse.body.id;

            const response = await authHelper
                .authenticatedGet(`/api/sessions/${sessionId}`)
                .expect(200);

            expect(response.body.id).toBe(sessionId);
            expect(response.body.name).toBe('Fetch Me');
            expect(response.body.description).toBe('Test description');
        });

        it('should return 404 if session does not exist', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedGet(`/api/sessions/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Session not found');
        });

        it('should return 404 if session belongs to another user', async () => {
            // Create session with first user
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

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Private Session' })
                .expect(201);

            const sessionId = createResponse.body.id;

            // Try to access with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedGet(`/api/sessions/${sessionId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Session not found');
        });
    });

    describe('PATCH /api/sessions/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.patch(`/api/sessions/${uuid}`).send({}).expect(401);
        });

        it('should update a session', async () => {
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

            const createResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, {
                    name: 'Original Name',
                    description: 'Original description'
                })
                .expect(201);

            const sessionId = createResponse.body.id;

            const updateDto: UpdateSessionDTO = {
                name: 'Updated Name',
                description: 'Updated description',
                completed: true
            };

            const response = await authHelper
                .authenticatedPatch(`/api/sessions/${sessionId}`, updateDto)
                .expect(200);

            expect(response.body.name).toBe('Updated Name');
            expect(response.body.description).toBe('Updated description');
            expect(response.body.completed).toBe(true);

            // Verify in database
            const updated = await sessionRepo.findOneBy({ id: sessionId });
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

            const createResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Toggle Session' })
                .expect(201);

            const sessionId = createResponse.body.id;
            expect(createResponse.body.completed).toBe(false);

            const toTrue = await authHelper
                .authenticatedPatch(`/api/sessions/${sessionId}`, { completed: true })
                .expect(200);
            expect(toTrue.body.completed).toBe(true);

            const toFalse = await authHelper
                .authenticatedPatch(`/api/sessions/${sessionId}`, { completed: false })
                .expect(200);
            expect(toFalse.body.completed).toBe(false);
        });

        it('should return 404 when updating non-existent session', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPatch(`/api/sessions/${nonExistentId}`, { name: 'Nope' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Session not found');
        });

        it('should prevent updating another user\'s session', async () => {
            // Create session with first user
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

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Protected Session' })
                .expect(201);

            const sessionId = createResponse.body.id;

            // Try to update with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedPatch(`/api/sessions/${sessionId}`, { name: 'Hacked' })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Session not found');

            // Verify session was not modified
            const session = await sessionRepo.findOneBy({ id: sessionId });
            expect(session!.name).toBe('Protected Session');
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

            const createResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Validation Test' })
                .expect(201);

            const sessionId = createResponse.body.id;

            const response = await authHelper
                .authenticatedPatch(`/api/sessions/${sessionId}`, { completed: 'yes' })
                .expect(400);

            expect(response.body.error).toBe('Validation failed');
            expect(response.body.errors.completed).toBeDefined();
        });
    });

    describe('DELETE /api/sessions/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.delete(`/api/sessions/${uuid}`).expect(401);
        });

        it('should soft delete a session', async () => {
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

            const createResponse = await authHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'To Delete' })
                .expect(201);

            const sessionId = createResponse.body.id;

            await authHelper
                .authenticatedDelete(`/api/sessions/${sessionId}`)
                .expect(204);

            // Verify session was soft deleted
            const deletedSession = await sessionRepo.findOne({
                where: { id: sessionId },
                withDeleted: true
            });

            expect(deletedSession).toBeTruthy();
            expect(deletedSession!.deletedAt).toBeTruthy();

            // Verify session doesn't appear in normal queries
            const normalQuery = await sessionRepo.findOneBy({ id: sessionId });
            expect(normalQuery).toBeNull();
        });

        it('should return 404 when deleting non-existent session', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedDelete(`/api/sessions/${nonExistentId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Session not found');
        });

        it('should prevent deleting another user\'s session', async () => {
            // Create session with first user
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

            const createResponse = await firstAuthHelper
                .authenticatedPost(`/api/blocks/${blockResponse.body.id}/sessions`, { name: 'Protected Session' })
                .expect(201);

            const sessionId = createResponse.body.id;

            // Try to delete with second user
            const { authHelper: secondAuthHelper } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            const response = await secondAuthHelper
                .authenticatedDelete(`/api/sessions/${sessionId}`)
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Session not found');

            // Verify session was not deleted
            const session = await sessionRepo.findOneBy({ id: sessionId });
            expect(session).toBeTruthy();
            expect(session!.deletedAt).toBeNull();
        });
    });
});
