import { Expose } from 'class-transformer';

export class CycleDTO {
    @Expose() id: string;
    @Expose() programId: string;
    @Expose() name: string;
    @Expose() description?: string;
    @Expose() goals?: string[];
    @Expose() completed: boolean;

    @Expose()
    _links?: {
        self: string;
        program: string;
        blocks: string;
    };
}
