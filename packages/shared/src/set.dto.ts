import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

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

export class CreateSetDTO {
    @IsNumber()
    @Min(0)
    @IsOptional()
    target_reps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    target_weight?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    target_percentage?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    target_rpe?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actual_reps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actual_weight?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    actual_rpe?: number;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @IsString()
    @IsOptional()
    tempo?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    rest?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateSetDTO {
    @IsNumber()
    @Min(0)
    @IsOptional()
    target_reps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    target_weight?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    target_percentage?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    target_rpe?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actual_reps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actual_weight?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    actual_rpe?: number;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @IsString()
    @IsOptional()
    tempo?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    rest?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}