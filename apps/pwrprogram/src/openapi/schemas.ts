import 'reflect-metadata';
import * as SharedDTOs from '@pwrprogram/shared';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

type JSONSchema = {
    type?: string;
    format?: string;
    nullable?: boolean;
    required?: string[];
    properties?: Record<string, JSONSchema>;
    items?: JSONSchema;
    additionalProperties?: boolean | JSONSchema;
    enum?: (string | number)[];
    description?: string;
    minLength?: number;
    $ref?: string;
    [key: string]: unknown;
};

// Retain references to all exported DTO classes so their decorators run and metadata is collected.
// (Tree-shaking isn't a concern in this Node context, but being explicit avoids accidental omissions.)
void Object.values(SharedDTOs);

const generatedRaw = validationMetadatasToSchemas();
// Just use exactly what class-validator-jsonschema produces, plus shared Error schema and pagination.
export const schemas: Record<string, JSONSchema> = {
    ...generatedRaw,
    Error: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string' } }
    },
    PaginationResponse: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages'],
        properties: {
            page: { type: 'integer', description: 'Current page number' },
            limit: { type: 'integer', description: 'Items per page' },
            total: { type: 'integer', description: 'Total number of items' },
            totalPages: { type: 'integer', description: 'Total number of pages' }
        }
    }
};
