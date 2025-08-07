// server/src/mappers/program.mapper.ts
import { plainToInstance } from 'class-transformer';
import { ProgramDTO } from '@pwrprogram/shared';
import { Program } from '../entity/program';

export function toProgramDTO(entity: Program): ProgramDTO {
    return plainToInstance(ProgramDTO, {
        ...entity,
        _links: {
            self: `/api/programs/${entity.id}`,
            cycles: `/api/programs/${entity.id}/cycles`,
            coach: entity.coachId ? `/api/users/${entity.coachId}` : undefined,
            user: `/api/users/${entity.userId}`,
        }
    }, {
        excludeExtraneousValues: true
    });
}
