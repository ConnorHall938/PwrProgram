import { plainToInstance } from 'class-transformer';
import { BlockDTO } from '@pwrprogram/shared';
import { Block } from '../entity/block';
import { handleMapperError } from '../utils/mapper.utils';
import { buildBlockLinks } from '../utils/hateoas';

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
