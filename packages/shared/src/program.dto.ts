// shared/dto/program.dto.ts
import { Expose } from 'class-transformer';

export class ProgramDTO {
    @Expose() id: string;
    @Expose() userId: string;
    @Expose() name: string;
    @Expose() description?: string;
    @Expose() coachId?: string;

    @Expose()
    _links?: {
        self: string;
        cycles: string;
    };
}
