import { CreateUserDTO } from '@pwrprogram/shared';
import * as supertest from 'supertest';
import type * as Express from 'express';

/**
 * Helper class for managing authentication in tests
 */
export class AuthHelper {
    private request: any; // SuperTest agent
    private cookies: string[] = [];

    constructor(app: Express.Application) {
        this.request = supertest.default(app);
    }

    /**
     * Generate a unique email for testing
     */
    static uniqueEmail(prefix: string = 'test'): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    }

    /**
     * Register a new user and automatically login
     * Returns the user data and session cookies
     */
    async registerAndLogin(userData?: Partial<CreateUserDTO>) {
        const createUserDto: CreateUserDTO = {
            email: userData?.email || AuthHelper.uniqueEmail('test'),
            password: userData?.password || 'testpassword123',
            firstName: userData?.firstName || 'Test',
            lastName: userData?.lastName || 'User',
        };

        const response = await this.request
            .post('/api/auth/register')
            .send(createUserDto)
            .expect(201);

        // Extract session cookie from registration response
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            this.cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        }

        return {
            user: response.body.user,
            credentials: { email: createUserDto.email, password: createUserDto.password },
            cookies: this.cookies,
        };
    }

    /**
     * Login with existing credentials
     * Returns the session cookies
     */
    async login(email: string, password: string) {
        const response = await this.request
            .post('/api/auth/login')
            .send({ email, password })
            .expect(200);

        // Extract session cookie
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            this.cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        }

        return {
            user: response.body.user,
            cookies: this.cookies,
        };
    }

    /**
     * Logout the current session
     */
    async logout() {
        await this.request
            .post('/api/auth/logout')
            .set('Cookie', this.cookies)
            .expect(200);

        this.cookies = [];
    }

    /**
     * Make an authenticated GET request
     */
    authenticatedGet(url: string) {
        return this.request
            .get(url)
            .set('Cookie', this.cookies);
    }

    /**
     * Make an authenticated POST request
     */
    authenticatedPost(url: string, data?: any) {
        return this.request
            .post(url)
            .set('Cookie', this.cookies)
            .send(data);
    }

    /**
     * Make an authenticated PATCH request
     */
    authenticatedPatch(url: string, data?: any) {
        return this.request
            .patch(url)
            .set('Cookie', this.cookies)
            .send(data);
    }

    /**
     * Make an authenticated DELETE request
     */
    authenticatedDelete(url: string) {
        return this.request
            .delete(url)
            .set('Cookie', this.cookies);
    }

    /**
     * Get the current session cookies
     */
    getCookies(): string[] {
        return this.cookies;
    }

    /**
     * Get the raw supertest request instance
     */
    getRequest(): any {
        return this.request;
    }
}

/**
 * Create a quick authenticated session for tests
 * Returns both the auth helper and the user data
 */
export async function createAuthenticatedSession(app: Express.Application, userData?: Partial<CreateUserDTO>) {
    const authHelper = new AuthHelper(app);
    const { user, credentials } = await authHelper.registerAndLogin(userData);

    return {
        authHelper,
        user,
        credentials,
        cookies: authHelper.getCookies(),
    };
}
