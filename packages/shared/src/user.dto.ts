import { Expose } from 'class-transformer';

export class UserDTO {
    @Expose() id: string;
    @Expose() username: string;
    @Expose() email: string;
    @Expose() createdAt: Date;
    @Expose() updatedAt: Date;

    @Expose()
    _links?: {
        self: string;
        programs: string;
        coach?: string; // Optional link to coach if applicable
    };
}