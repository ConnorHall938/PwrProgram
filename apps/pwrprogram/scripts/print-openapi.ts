import { openApiSpec } from '../src/openapi';
console.log('Top-level keys:', Object.keys(openApiSpec));
console.log('Schema keys:', Object.keys(openApiSpec.components?.schemas || {}));
