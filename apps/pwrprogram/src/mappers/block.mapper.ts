import { BlockDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';

import { Block } from '../entity/block';
import { buildBlockLinks } from '../utils/hateoas';
import { handleMapperError } from '../utils/mapper.utils';

export function toBlockDTO(entity: Block): BlockDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Block entity');
    }

    try {
        return plainToInstance(BlockDTO, { ...entity, _links: buildBlockLinks(entity) }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Block', entity.id);
    }
}
