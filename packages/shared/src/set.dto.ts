import { Expose } from 'class-transformer';

export class SetDTO {
    @Expose() id: string;
    @Expose() exerciseId: string;
    @Expose() targetReps?: number;
    @Expose() targetWeight?: number;
    @Expose() targetRPE?: number;
    @Expose() targetPercentage?: number;
    @Expose() completed: boolean;
    @Expose() actualReps?: number;
    @Expose() actualWeight?: number;
    @Expose() actualRPE?: number;
    @Expose() actualPercentage?: number;

    @Expose()
    _links?: {
        self: string;
        exercise: string;
    };
}