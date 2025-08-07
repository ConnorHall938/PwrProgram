import { Expose } from 'class-transformer';

export class BlockDTO {
    @Expose() id: string;
    @Expose() cycleId: string;
    @Expose() name: string;
    @Expose() description?: string;
    @Expose() completed: boolean;

    @Expose()
    _links?: {
        self: string;
        cycle: string;
        sessions: string;
    };
}