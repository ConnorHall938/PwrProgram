import { plainToInstance } from 'class-transformer';
import { ExerciseDTO } from '@pwrprogram/shared';
import { Exercise } from '../entity/exercise';
import { handleMapperError } from '../utils/mapper.utils';
import { buildExerciseLinks } from '../utils/hateoas';

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
