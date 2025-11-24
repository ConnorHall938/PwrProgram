import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class SessionDTO {
    @Expose() id: string;
    @Expose() blockId: string;
    @Expose() name: string;
    @Expose() description?: string;
    @Expose() completed?: boolean;

    @Expose()
    _links?: {
        self: string;
        block: string;
        exercises: string;
    };
}

export class CreateSessionDTO {
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

export class UpdateSessionDTO {
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