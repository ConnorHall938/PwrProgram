import { ExerciseDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';

import { Exercise } from '../entity';
import { buildExerciseLinks } from '../utils/hateoas';
import { handleMapperError } from '../utils/mapper.utils';

export function toExerciseDTO(entity: Exercise): ExerciseDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Exercise entity');
    }

    try {
        return plainToInstance(ExerciseDTO, { ...entity, _links: buildExerciseLinks(entity) }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Exercise', entity.id);
    }
}
