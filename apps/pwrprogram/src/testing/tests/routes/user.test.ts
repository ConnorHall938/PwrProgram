import { CreateUserDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import { Repository } from 'typeorm';

import { User } from '../../../entity/User';
import { app } from '../../setup';
import { testDataSource } from '../../utils/test-data-source';
import { AuthHelper, createAuthenticatedSession } from '../../utils/auth-helper';

const request = supertest.default(app);

describe('User API', () => {
    let userRepository: Repository<User>;

    beforeAll(() => {
        userRepository = testDataSource.getRepository(User);
    });

    beforeEach(async () => {
        // Table clearing is handled in setup.ts
    });

    const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    describe('Registration (POST /api/auth/register)', () => {
        it('should register a new user and return proper response DTO with session', async () => {
            const createUserDto: CreateUserDTO = {
                email: uniqueEmail('test'),
                password: 'testpassword123',
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await request
                .post('/api/auth/register')
                .send(createUserDto)
                .expect(201);

            // Verify response structure
            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('user');

            const user = response.body.user;
            expect(user).toHaveProperty('id');
            expect(user.email).toBe(createUserDto.email);
            expect(user.firstName).toBe(createUserDto.firstName);
            expect(user.lastName).toBe(createUserDto.lastName);
            expect(user).not.toHaveProperty('password');

            // Verify session cookie was set
            expect(response.headers['set-cookie']).toBeDefined();

            // Verify database - password should be hashed
            const savedUser = await userRepository.findOne({
                where: { id: user.id },
                select: ['id', 'email', 'firstName', 'lastName', 'password']
            });
            expect(savedUser).toBeTruthy();
            expect(savedUser!.email).toBe(createUserDto.email);
            expect(savedUser!.password).toBeDefined();
            expect(savedUser!.password).not.toBe(createUserDto.password); // Should be hashed
            expect(savedUser!.password.startsWith('$2b$')).toBe(true); // Bcrypt hash
        });

        it('should validate registration payload and return 400 with errors', async () => {
            const badPayload = {
                email: 'not-an-email',
                password: '123',
                // missing firstName
            } as Partial<CreateUserDTO>;

            const res = await request.post('/api/auth/register').send(badPayload).expect(400);
            expect(res.body).toHaveProperty('error', 'Validation failed');
            expect(res.body).toHaveProperty('errors');
            expect(Object.keys(res.body.errors)).toEqual(
                expect.arrayContaining(['firstName', 'email', 'password'])
            );
        });

        it('should return 400 when email already exists', async () => {
            const unique = uniqueEmail('dupe');
            const dto: CreateUserDTO = {
                email: unique,
                password: 'dupepass',
                firstName: 'Dupe',
                lastName: 'User'
            };
            await request.post('/api/auth/register').send(dto).expect(201);
            const res = await request.post('/api/auth/register').send(dto).expect(400);
            expect(res.body).toHaveProperty('error', 'Email already exists');
        });

        it('should allow registering a user without optional lastName', async () => {
            const dto: CreateUserDTO = {
                email: uniqueEmail('nolast'),
                password: 'strongpass',
                firstName: 'NoLast'
            };

            const res = await request.post('/api/auth/register').send(dto).expect(201);
            expect(res.body.user.lastName).toBeUndefined();

            const entity = await userRepository.findOneBy({ id: res.body.user.id });
            expect(entity!.lastName).toBeNull();
        });

        it('should reject password shorter than 6 chars', async () => {
            const dto = {
                email: uniqueEmail('shortpw'),
                password: '12345',
                firstName: 'Short'
            };
            const res = await request.post('/api/auth/register').send(dto).expect(400);
            expect(res.body.error).toBe('Validation failed');
            expect(res.body.errors.password).toBeDefined();
        });
    });

    describe('Login (POST /api/auth/login)', () => {
        it('should login with valid credentials and return session cookie', async () => {
            const credentials = {
                email: uniqueEmail('login'),
                password: 'loginpass123',
                firstName: 'Login',
                lastName: 'Test'
            };

            // Register first
            await request.post('/api/auth/register').send(credentials).expect(201);

            // Now login
            const response = await request
                .post('/api/auth/login')
                .send({ email: credentials.email, password: credentials.password })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(credentials.email);
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 401 for invalid email', async () => {
            const res = await request
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password' })
                .expect(401);

            expect(res.body).toHaveProperty('error', 'Invalid email or password');
        });

        it('should return 401 for invalid password', async () => {
            const credentials = {
                email: uniqueEmail('wrongpw'),
                password: 'correctpass',
                firstName: 'Wrong',
            };

            await request.post('/api/auth/register').send(credentials).expect(201);

            const res = await request
                .post('/api/auth/login')
                .send({ email: credentials.email, password: 'wrongpassword' })
                .expect(401);

            expect(res.body).toHaveProperty('error', 'Invalid email or password');
        });
    });

    describe('Authentication Check (GET /api/auth/me)', () => {
        it('should return current user when authenticated', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const response = await authHelper.authenticatedGet('/api/auth/me').expect(200);

            expect(response.body.user).toHaveProperty('id', user.id);
            expect(response.body.user).toHaveProperty('email', user.email);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should return 401 when not authenticated', async () => {
            await request.get('/api/auth/me').expect(401);
        });
    });

    describe('Logout (POST /api/auth/logout)', () => {
        it('should logout and destroy session', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Should be able to access protected endpoint
            await authHelper.authenticatedGet('/api/auth/me').expect(200);

            // Logout
            await authHelper.logout();

            // Should no longer be able to access protected endpoint
            await authHelper.authenticatedGet('/api/auth/me').expect(401);
        });
    });

    describe('List Users (GET /api/users)', () => {
        it('should require authentication', async () => {
            await request.get('/api/users').expect(401);
        });

        it('should list users with pagination when authenticated', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            // Create a few more users
            await request.post('/api/auth/register').send({
                email: uniqueEmail('alpha'),
                password: 'password1',
                firstName: 'Alpha',
            }).expect(201);

            await request.post('/api/auth/register').send({
                email: uniqueEmail('beta'),
                password: 'password2',
                firstName: 'Beta',
                lastName: 'Two'
            }).expect(201);

            const response = await authHelper.authenticatedGet('/api/users?page=1&limit=10').expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);

            // Verify pagination metadata
            expect(response.body.pagination).toHaveProperty('page', 1);
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('totalPages');

            // Ensure no passwords in response
            for (const u of response.body.data) {
                expect(u).toHaveProperty('id');
                expect(u).not.toHaveProperty('password');
            }
        });

        it('should respect pagination limits', async () => {
            const { authHelper } = await createAuthenticatedSession(app);

            const response = await authHelper.authenticatedGet('/api/users?page=1&limit=2').expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination.limit).toBe(2);
        });
    });

    describe('Get Single User (GET /api/users/:id)', () => {
        it('should require authentication', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000';
            await request.get(`/api/users/${uuid}`).expect(401);
        });

        it('should fetch a single user by id when authenticated', async () => {
            const { authHelper, user } = await createAuthenticatedSession(app);

            const res = await authHelper.authenticatedGet(`/api/users/${user.id}`).expect(200);

            expect(res.body.id).toBe(user.id);
            expect(res.body.email).toBe(user.email);
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 404 for a non-existent user id', async () => {
            const { authHelper } = await createAuthenticatedSession(app);
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            const res = await authHelper.authenticatedGet(`/api/users/${nonExistentId}`).expect(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });
    });
});
