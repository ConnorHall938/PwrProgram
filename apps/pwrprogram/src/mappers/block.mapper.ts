import { plainToInstance } from 'class-transformer';
import { BlockDTO } from '@pwrprogram/shared';
import { Block } from '../entity/block';
import { handleMapperError } from '../utils/mapper.utils';

export function toBlockDTO(entity: Block): BlockDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Block entity');
    }

    try {
        return plainToInstance(BlockDTO, {
            ...entity,
            _links: {
                self: `/api/cycles/${entity.cycleId}/blocks/${entity.id}`,
                cycle: `/api/cycles/${entity.cycleId}`,
                sessions: `/api/blocks/${entity.id}/sessions`,
            }
        }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Block', entity.id);
    }
}
