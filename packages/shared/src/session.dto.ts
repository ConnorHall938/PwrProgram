import { Expose } from 'class-transformer';

export class SessionDTO {
    @Expose() id: string;
    @Expose() blockId: string;
    @Expose() name: string;
    @Expose() description?: string;

    @Expose()
    _links?: {
        self: string;
        block: string;
        exercises: string;
    };
}