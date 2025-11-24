// shared/dto/program.dto.ts
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

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
        coach?: string;
        user: string;
    };
}

export class CreateProgramDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    coachId?: string;
}

export class UpdateProgramDTO {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    coachId?: string;
}
