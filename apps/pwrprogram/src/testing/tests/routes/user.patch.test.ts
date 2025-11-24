import { UpdateUserDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { User } from '../../../entity/User';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('User PATCH API', () => {
    let userRepository: Repository<User>;

    beforeAll(() => {
        userRepository = testDataSource.getRepository(User);
    });

    describe('PATCH /api/users/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.patch(`/api/users/${uuid}`).send({}).expect(401);
        });

        it('should update user firstName', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app, {
                firstName: 'Original',
                lastName: 'Name'
            });

            const updateDto: UpdateUserDTO = {
                firstName: 'Updated'
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(200);

            expect(response.body.firstName).toBe('Updated');
            expect(response.body.lastName).toBe('Name'); // Unchanged
            expect(response.body).not.toHaveProperty('password');

            // Verify in database
            const updated = await userRepository.findOneBy({ id: user.id });
            expect(updated!.firstName).toBe('Updated');
        });

        it('should update user lastName', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app, {
                firstName: 'Test',
                lastName: 'Original'
            });

            const updateDto: UpdateUserDTO = {
                lastName: 'NewLastName'
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(200);

            expect(response.body.lastName).toBe('NewLastName');
            expect(response.body.firstName).toBe('Test'); // Unchanged
        });

        it('should update user email', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const newEmail = `updated-${Date.now()}@example.com`;
            const updateDto: UpdateUserDTO = {
                email: newEmail
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(200);

            expect(response.body.email).toBe(newEmail);

            // Verify in database
            const updated = await userRepository.findOneBy({ id: user.id });
            expect(updated!.email).toBe(newEmail);
        });

        it('should update multiple fields at once', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const updateDto: UpdateUserDTO = {
                firstName: 'Multi',
                lastName: 'Update',
                email: `multi-${Date.now()}@example.com`
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(200);

            expect(response.body.firstName).toBe('Multi');
            expect(response.body.lastName).toBe('Update');
            expect(response.body.email).toBe(updateDto.email);
        });

        it('should change password with valid currentPassword', async () => {
            const originalPassword = 'originalpass123';
            const { authHelper, user } = await createAuthenticatedSession(app, {
                password: originalPassword
            });

            const updateDto: UpdateUserDTO = {
                currentPassword: originalPassword,
                newPassword: 'newpassword456'
            };

            await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(200);

            // Verify password was changed by trying to login with new password
            await authHelper.logout();

            const loginResponse = await request
                .post('/api/auth/login')
                .send({ email: user.email, password: 'newpassword456' })
                .expect(200);

            expect(loginResponse.body.user.id).toBe(user.id);
        });

        it('should reject password change with invalid currentPassword', async () => {
            const originalPassword = 'originalpass123';
            const { authHelper, user } = await createAuthenticatedSession(app, {
                password: originalPassword
            });

            const updateDto: UpdateUserDTO = {
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword456'
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Current password is incorrect');
        });

        it('should reject password change if currentPassword is missing', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const updateDto: UpdateUserDTO = {
                newPassword: 'newpassword456'
                // currentPassword missing
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject password change if newPassword is too short', async () => {
            const originalPassword = 'originalpass123';
            const { authHelper, user } = await createAuthenticatedSession(app, {
                password: originalPassword
            });

            const updateDto: UpdateUserDTO = {
                currentPassword: originalPassword,
                newPassword: '12345' // Too short
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
        });

        it('should prevent users from updating other users', async () => {
            const { authHelper } = await createAuthenticatedSession(app, {
                email: `user1-${Date.now()}@example.com`
            });

            // Create another user
            const user2Response = await request.post('/api/auth/register').send({
                email: `user2-${Date.now()}@example.com`,
                password: 'password123',
                firstName: 'User2'
            }).expect(201);

            const user2Id = user2Response.body.user.id;

            // Try to update user2 while authenticated as user1
            const response = await authHelper
                .authenticatedPatch(`/api/users/${user2Id}`, { firstName: 'Hacked' })
                .expect(403);

            expect(response.body).toHaveProperty('error', 'You can only update your own profile');

            // Verify user2 was not modified
            const user2 = await userRepository.findOneBy({ id: user2Id });
            expect(user2!.firstName).toBe('User2');
        });

        it('should return 404 for non-existent user id', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedPatch(`/api/users/${nonExistentId}`, { firstName: 'Test' })
                .expect(403); // User can't update profile they don't own

            expect(response.body).toHaveProperty('error', 'You can only update your own profile');
        });

        it('should validate email format', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const updateDto: UpdateUserDTO = {
                email: 'not-a-valid-email'
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body.errors).toHaveProperty('email');
        });

        it('should reject duplicate email', async () => {
            // Create first user
            const existingEmail = `existing-${Date.now()}@example.com`;
            await request.post('/api/auth/register').send({
                email: existingEmail,
                password: 'password123',
                firstName: 'Existing'
            }).expect(201);

            // Create second user
            const { authHelper, user } = await createAuthenticatedSession(app, {
                email: `second-${Date.now()}@example.com`
            });

            // Try to change second user's email to first user's email
            const updateDto: UpdateUserDTO = {
                email: existingEmail
            };

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Email already exists');
        });

        it('should allow updating email to same email (no-op)', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const updateDto: UpdateUserDTO = {
                email: user.email // Same email
            };

            await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, updateDto)
                .expect(200);
        });

        it('should handle empty update (no fields provided)', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const response = await authHelper
                .authenticatedPatch(`/api/users/${user.id}`, {})
                .expect(200);

            // Should return unchanged user
            expect(response.body.id).toBe(user.id);
            expect(response.body.email).toBe(user.email);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.delete(`/api/users/${uuid}`).expect(401);
        });

        it('should soft delete user account', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            await authHelper
                .authenticatedDelete(`/api/users/${user.id}`)
                .expect(204);

            // Verify user was soft deleted
            const deletedUser = await userRepository.findOne({
                where: { id: user.id },
                withDeleted: true
            });

            expect(deletedUser).toBeTruthy();
            expect(deletedUser!.deletedAt).toBeTruthy();

            // Verify user can't be found in normal queries
            const normalQuery = await userRepository.findOneBy({ id: user.id });
            expect(normalQuery).toBeNull();
        });

        it('should destroy session after deleting account', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            // Delete account
            await authHelper
                .authenticatedDelete(`/api/users/${user.id}`)
                .expect(204);

            // Session should be destroyed - can't access protected endpoints
            await authHelper.authenticatedGet('/api/auth/me').expect(401);
        });

        it('should prevent users from deleting other users', async () => {
            const { authHelper } = await createAuthenticatedSession(app, {
                email: `user1-${Date.now()}@example.com`
            });

            // Create another user
            const user2Response = await request.post('/api/auth/register').send({
                email: `user2-${Date.now()}@example.com`,
                password: 'password123',
                firstName: 'User2'
            }).expect(201);

            const user2Id = user2Response.body.user.id;

            // Try to delete user2 while authenticated as user1
            const response = await authHelper
                .authenticatedDelete(`/api/users/${user2Id}`)
                .expect(403);

            expect(response.body).toHaveProperty('error', 'You can only delete your own account');

            // Verify user2 was not deleted
            const user2 = await userRepository.findOneBy({ id: user2Id });
            expect(user2).toBeTruthy();
        });

        it('should return 403 for non-existent user id', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const response = await authHelper
                .authenticatedDelete(`/api/users/${nonExistentId}`)
                .expect(403);

            expect(response.body).toHaveProperty('error', 'You can only delete your own account');
        });
    });
});
