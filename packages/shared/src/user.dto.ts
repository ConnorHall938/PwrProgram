import { Expose, Transform } from 'class-transformer';
import { IsString, MinLength, IsOptional, IsEmail, IsObject } from 'class-validator';

export class CreateUserDTO {
    @Expose()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    firstName: string;

    @Expose()
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const t = value.trim();
        return t === '' ? undefined : t;
    })
    @IsString()
    lastName?: string;

    @Expose()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsEmail()
    email: string;

    @Expose()
    @IsString()
    @MinLength(6)
    password: string;
}

export class UserResponseDTO {
    @Expose()
    @IsString()
    id: string;

    @Expose()
    @IsString()
    firstName: string;

    @Expose()
    @IsString()
    lastName?: string;

    @Expose()
    @IsEmail()
    email: string;

    @Expose()
    @IsObject()
    _links?: {
        self: string;
        programs: string;
        coach?: string;
    };
}