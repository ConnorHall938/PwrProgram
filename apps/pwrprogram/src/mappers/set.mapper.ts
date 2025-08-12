import { SetDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';

import { Set } from '../entity';
import { buildSetLinks } from '../utils/hateoas';
import { handleMapperError } from '../utils/mapper.utils';

export function toSetDTO(entity: Set): SetDTO {
    if (!entity) throw new Error('Cannot map null or undefined Set entity');
    try {
        const plain = {
            id: entity.id,
            exerciseId: entity.exerciseId,
            targetReps: entity.targetReps,
            targetWeight: entity.targetWeight,
            targetRpe: entity.targetRpe,
            targetPercentage: entity.targetPercentage,
            completed: entity.completed,
            actualReps: entity.actualReps,
            actualWeight: entity.actualWeight,
            actualRpe: entity.actualRpe,
            actualPercentage: undefined, // placeholder
            _links: buildSetLinks(entity)
        };
        return plainToInstance(SetDTO, plain, { excludeExtraneousValues: true });
    } catch (error) {
        handleMapperError(error, 'Set', entity.id);
    }
}
