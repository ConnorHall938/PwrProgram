import { plainToInstance } from 'class-transformer';
import { SetDTO } from '@pwrprogram/shared';
import { Set } from '../entity/set';
import { handleMapperError } from '../utils/mapper.utils';

export function toSetDTO(entity: Set): SetDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Set entity');
    }

    try {
        return plainToInstance(SetDTO, {
            ...entity,
            _links: {
                self: `/api/exercises/${entity.exerciseId}/sets/${entity.id}`,
                exercise: `/api/exercises/${entity.exerciseId}`,
            }
        }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Set', entity.id);
    }
}
