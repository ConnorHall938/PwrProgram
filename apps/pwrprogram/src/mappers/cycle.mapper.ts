import { plainToInstance } from 'class-transformer';
import { CycleDTO } from '@pwrprogram/shared';
import { Cycle } from '../entity/cycle';
import { handleMapperError } from '../utils/mapper.utils';
import { buildCycleLinks } from '../utils/hateoas';

export function toCycleDTO(entity: Cycle): CycleDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Cycle entity');
    }

    try {
        return plainToInstance(CycleDTO, { ...entity, _links: buildCycleLinks(entity) }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Cycle', entity.id);
    }
}
