import { plainToInstance } from 'class-transformer';
import { SetDTO } from '@pwrprogram/shared';
import { Set } from '../entity/set';

export function toSetDTO(entity: Set): SetDTO {
    return plainToInstance(SetDTO, {
        ...entity,
        _links: {
            self: `/api/exercises/${entity.exerciseId}/sets/${entity.id}`,
            exercise: `/api/exercises/${entity.exerciseId}`,
        }
    }, {
        excludeExtraneousValues: true
    });
}
