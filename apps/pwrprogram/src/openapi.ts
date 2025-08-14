import { paths } from './openapi/paths';
import { schemas } from './openapi/schemas';

// Construct OpenAPI spec directly (swagger-jsdoc adds no value without JSDoc scanning here)
export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'PwrProgram API',
        version: '0.1.0',
        description: 'API documentation for PwrProgram'
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local dev' }
    ],
    paths,
    components: { schemas }
};
