import { testDataSource } from '../../utils/test-data-source';
import { User } from '../../../entity/User';
import { Repository } from 'typeorm';
import * as supertest from 'supertest';
import { CreateUserDTO } from '@pwrprogram/shared';
import { app } from '../../setup';
const request = supertest.default(app);

describe('User API', () => {
    let userRepository: Repository<User>;

    beforeAll(() => {
        userRepository = testDataSource.getRepository(User);
    });

    beforeEach(async () => {
        // Table clearing is handled in setup.ts
    });

    it('should create a new user and return proper response DTO', async () => {
        const createUserDto: CreateUserDTO = {
            email: 'test@example.com',
            password: 'testpassword123',
            firstName: 'Test',
            lastName: 'User'
        };

        const response = await request
            .post('/api/users')
            .send(createUserDto)
            .expect(201);

        // Verify response
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(createUserDto.email);
        expect(response.body.firstName).toBe(createUserDto.firstName);
        expect(response.body.lastName).toBe(createUserDto.lastName);
        expect(response.body).not.toHaveProperty('password');

        // Verify HATEOAS links
        expect(response.body._links).toBeDefined();
        expect(response.body._links.self).toBe(`/api/users/${response.body.id}`);
        expect(response.body._links.programs).toBe(`/api/users/${response.body.id}/programs`);

        // Verify database
        const savedUser = await userRepository.findOneBy({ id: response.body.id });
        expect(savedUser).toBeTruthy();
        expect(savedUser!.email).toBe(createUserDto.email);
        expect(savedUser!.firstName).toBe(createUserDto.firstName);
        expect(savedUser!.lastName).toBe(createUserDto.lastName);
        expect(savedUser!.password).toBe(createUserDto.password);
    });

    it('should list users and return DTOs without sensitive fields', async () => {
        const u1: CreateUserDTO = {
            email: 'alpha@example.com',
            password: 'password1',
            firstName: 'Alpha',
        };
        const u2: CreateUserDTO = {
            email: 'beta@example.com',
            password: 'password2',
            firstName: 'Beta',
            lastName: 'Two'
        };

        const r1 = await request.post('/api/users').send(u1).expect(201);
        const r2 = await request.post('/api/users').send(u2).expect(201);

        const list = await request.get('/api/users').expect(200);
        expect(Array.isArray(list.body)).toBe(true);
        expect(list.body.length).toBe(2);
        const emails = list.body.map((u: any) => u.email);
        expect(emails).toEqual(expect.arrayContaining([u1.email, u2.email]));
        // Ensure DTO shape
        for (const u of list.body) {
            expect(u).toHaveProperty('id');
            expect(u).not.toHaveProperty('password');
            expect(u._links).toBeDefined();
            expect(u._links.self).toBe(`/api/users/${u.id}`);
            expect(u._links.programs).toBe(`/api/users/${u.id}/programs`);
        }
    });

    it('should fetch a single user by id', async () => {
        const payload: CreateUserDTO = {
            email: 'single@example.com',
            password: 'singlepass',
            firstName: 'Single',
            lastName: 'User'
        };
        const created = await request.post('/api/users').send(payload).expect(201);
        const id = created.body.id;

        const res = await request.get(`/api/users/${id}`).expect(200);
        expect(res.body.id).toBe(id);
        expect(res.body.email).toBe(payload.email);
        expect(res.body.firstName).toBe(payload.firstName);
        expect(res.body.lastName).toBe(payload.lastName);
        expect(res.body).not.toHaveProperty('password');
        expect(res.body._links.self).toBe(`/api/users/${id}`);
        expect(res.body._links.programs).toBe(`/api/users/${id}/programs`);
    });

    it('should return 404 for a non-existent user id', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const res = await request.get(`/api/users/${nonExistentId}`).expect(404);
        expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should validate user creation payload and return 400 with errors', async () => {
        const badPayload = {
            email: 'not-an-email',
            password: '123',
            // missing firstName
        } as Partial<CreateUserDTO>;

        const res = await request.post('/api/users').send(badPayload).expect(400);
        expect(res.body).toHaveProperty('message', 'Validation failed');
        expect(res.body).toHaveProperty('errors');
        // Expect at least these validation errors
        expect(Object.keys(res.body.errors)).toEqual(
            expect.arrayContaining(['firstName', 'email', 'password'])
        );
    });

    it('should return 400 when email already exists', async () => {
        const dto: CreateUserDTO = {
            email: 'dupe@example.com',
            password: 'dupepass',
            firstName: 'Dupe',
            lastName: 'User'
        };
        await request.post('/api/users').send(dto).expect(201);
        const res = await request.post('/api/users').send(dto).expect(400);
        expect(res.body).toHaveProperty('message', 'Email already exists');
    });

    // New tests -------------------------------------------------------------
    it('should allow creating a user without optional lastName (omitted field)', async () => {
        const dto: CreateUserDTO = {
            email: 'nolast@example.com',
            password: 'strongpass',
            firstName: 'NoLast'
        } as any; // lastName intentionally omitted

        const res = await request.post('/api/users').send(dto).expect(201);
        expect(res.body.lastName).toBeUndefined(); // DTO should omit
        const entity = await userRepository.findOneBy({ id: res.body.id });
        expect(entity!.lastName).toBeNull(); // stored as null
    });

    it('should trim leading and trailing spaces from name & email fields', async () => {
        const raw = {
            email: '  spaced@example.com  ',
            password: 'passwordWith Spaces', // password should NOT be trimmed
            firstName: '  Alice  ',
            lastName: '  Wonderland  '
        } as any;
        const res = await request.post('/api/users').send(raw).expect(201);
        expect(res.body.email).toBe('spaced@example.com');
        expect(res.body.firstName).toBe('Alice');
        expect(res.body.lastName).toBe('Wonderland');
        const entity = await userRepository.findOneBy({ id: res.body.id });
        expect(entity!.email).toBe('spaced@example.com');
        expect(entity!.firstName).toBe('Alice');
        expect(entity!.lastName).toBe('Wonderland');
        // Ensure password kept exact (no trimming) by re-fetching raw entity
        expect(entity!.password).toBe(raw.password);
    });

    it('should treat explicitly provided empty string lastName as empty in DTO (omitted) & store null', async () => {
        const dto: CreateUserDTO = {
            email: 'emptyln@example.com',
            password: 'emptypass',
            firstName: 'Empty',
            lastName: '' // explicit empty
        } as any;
        const res = await request.post('/api/users').send(dto).expect(201);
        expect(res.body.lastName).toBeUndefined(); // omitted after sanitization
        const entity = await userRepository.findOneBy({ id: res.body.id });
        expect(entity!.lastName).toBeNull();
    });

    it('should reject password shorter than 6 chars (exact length check, no trimming)', async () => {
        const dto = {
            email: 'shortpw@example.com',
            password: '12345', // length 5
            firstName: 'Short'
        } as any;
        const res = await request.post('/api/users').send(dto).expect(400);
        expect(res.body.message).toBe('Validation failed');
        expect(res.body.errors.password).toBeDefined();
    });

    it('should collapse whitespace-only lastName to omitted in DTO', async () => {
        const dto: CreateUserDTO = {
            email: 'whitespace@example.com',
            password: 'whitespacepass',
            firstName: 'White',
            lastName: '    '
        } as any;
        const res = await request.post('/api/users').send(dto).expect(201);
        expect(res.body.lastName).toBeUndefined();
        const entity = await userRepository.findOneBy({ id: res.body.id });
        expect(entity!.lastName).toBeNull();
    });
});
