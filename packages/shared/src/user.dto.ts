import { Expose } from 'class-transformer';
import { IsString, MinLength, IsOptional, IsEmail, IsObject } from 'class-validator';

export class CreateUserDTO {
    @Expose()
    @IsString()
    firstName: string;

    @Expose()
    @IsOptional()
    @IsString()
    lastName?: string;

    @Expose()
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