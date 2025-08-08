import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, Min, IsNotEmpty } from 'class-validator';

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

export class CreateBlockDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    goals?: string[];

    @IsNumber()
    @Min(1)
    @IsOptional()
    sessions_per_week?: number;
}

export class UpdateBlockDTO {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    goals?: string[];

    @IsNumber()
    @Min(1)
    @IsOptional()
    sessions_per_week?: number;
}