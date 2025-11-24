import { paths } from './openapi/paths';
import { schemas } from './openapi/schemas';

// Construct OpenAPI spec directly (swagger-jsdoc adds no value without JSDoc scanning here)
export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'PwrProgram API',
        version: '1.0.0',
        description: 'Production-ready API for fitness program management with secure authentication'
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local dev' }
    ],
    paths,
    components: {
        schemas,
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'connect.sid',
                description: 'Session cookie authentication. Login via /api/auth/login to obtain session cookie.'
            }
        }
    }
};
