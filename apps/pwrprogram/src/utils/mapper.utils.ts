export class MapperError extends Error {
    constructor(
        message: string,
        public readonly entityType: string,
        public readonly entityId?: string | number,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'MapperError';
    }
}

export function handleMapperError(error: unknown, entityType: string, entityId?: string | number): never {
    console.error(`Error mapping ${entityType}${entityId ? ` (ID: ${entityId})` : ''}: `, error);
    if (error instanceof MapperError) {
        throw error;
    }
    throw new MapperError(
        `Failed to map ${entityType}${entityId ? ` with ID ${entityId}` : ''}`,
        entityType,
        entityId,
        error
    );
}
