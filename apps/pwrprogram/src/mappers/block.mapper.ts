import { plainToInstance } from 'class-transformer';
import { BlockDTO } from '@pwrprogram/shared';
import { Block } from '../entity/block';

export function toBlockDTO(entity: Block): BlockDTO {
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
}
