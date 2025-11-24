import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, IsNotEmpty } from 'class-validator';

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

export class CreateCycleDTO {
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
}

export class UpdateCycleDTO {
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
}
