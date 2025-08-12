// server/src/mappers/program.mapper.ts
import { ProgramDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';

import { Program } from '../entity';
import { buildProgramLinks } from '../utils/hateoas';
import { handleMapperError } from '../utils/mapper.utils';

export function toProgramDTO(entity: Program): ProgramDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Program entity');
    }

    try {
        return plainToInstance(ProgramDTO, { ...entity, _links: buildProgramLinks(entity) }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Program', entity.id);
    }
}
