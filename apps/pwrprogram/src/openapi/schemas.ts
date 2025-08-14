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
// Just use exactly what class-validator-jsonschema produces, plus shared Error schema.
export const schemas: Record<string, JSONSchema> = {
    ...generatedRaw,
    Error: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string' } }
    }
};
