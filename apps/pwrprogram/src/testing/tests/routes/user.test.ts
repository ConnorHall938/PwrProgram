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
});
