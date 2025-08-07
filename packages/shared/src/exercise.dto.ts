import { Expose } from 'class-transformer';

export class ExerciseDTO {
    @Expose() id: string;
    @Expose() sessionId: string;
    @Expose() name: string;
    @Expose() description?: string;

    @Expose()
    _links?: {
        self: string;
        session: string;
        sets: string;
    };
}