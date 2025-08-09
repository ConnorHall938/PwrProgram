import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class SetDTO {
    @Expose() id: string;
    @Expose() exerciseId: string;
    @Expose() targetReps?: number;
    @Expose() targetWeight?: number;
    @Expose() targetRpe?: number;
    @Expose() targetPercentage?: number;
    @Expose() completed: boolean;
    @Expose() actualReps?: number;
    @Expose() actualWeight?: number;
    @Expose() actualRpe?: number;
    @Expose() actualPercentage?: number; // reserved

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
    targetReps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    targetWeight?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    targetPercentage?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    targetRpe?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actualReps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actualWeight?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    actualRpe?: number;

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
    targetReps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    targetWeight?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    targetPercentage?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    targetRpe?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actualReps?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    actualWeight?: number;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    actualRpe?: number;

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