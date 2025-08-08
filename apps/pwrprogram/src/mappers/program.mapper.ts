// server/src/mappers/program.mapper.ts
import { plainToInstance } from 'class-transformer';
import { ProgramDTO } from '@pwrprogram/shared';
import { Program } from '../entity/program';
import { handleMapperError } from '../utils/mapper.utils';

export function toProgramDTO(entity: Program): ProgramDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Program entity');
    }

    try {
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
    } catch (error) {
        handleMapperError(error, 'Program', entity.id);
    }
}
