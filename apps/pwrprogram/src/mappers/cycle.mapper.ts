import { CycleDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';

import { Cycle } from '../entity';
import { buildCycleLinks } from '../utils/hateoas';
import { handleMapperError } from '../utils/mapper.utils';

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
