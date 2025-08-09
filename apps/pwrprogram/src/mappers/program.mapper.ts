// server/src/mappers/program.mapper.ts
import { plainToInstance } from 'class-transformer';
import { ProgramDTO } from '@pwrprogram/shared';
import { Program } from '../entity/program';
import { handleMapperError } from '../utils/mapper.utils';
import { buildProgramLinks } from '../utils/hateoas';

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
