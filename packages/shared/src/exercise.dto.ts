import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class ExerciseDTO {
    @Expose() id: string;
    @Expose() sessionId: string;
    @Expose() name: string;
    @Expose() description?: string;
    @Expose() completed?: boolean;

    @Expose()
    _links?: {
        self: string;
        session: string;
        sets: string;
    };
}

export class CreateExerciseDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;
}

export class UpdateExerciseDTO {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;
}