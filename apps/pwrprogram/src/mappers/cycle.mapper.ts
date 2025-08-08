import { plainToInstance } from 'class-transformer';
import { CycleDTO } from '@pwrprogram/shared';
import { Cycle } from '../entity/cycle';
import { handleMapperError } from '../utils/mapper.utils';

export function toCycleDTO(entity: Cycle): CycleDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Cycle entity');
    }

    try {
        return plainToInstance(CycleDTO, {
            ...entity,
            _links: {
                self: `/api/programs/${entity.programId}/cycles/${entity.id}`,
                program: `/api/programs/${entity.programId}`,
                blocks: `/api/cycles/${entity.id}/blocks`,
            }
        }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Cycle', entity.id);
    }
}
