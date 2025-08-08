import { plainToInstance } from 'class-transformer';
import { ExerciseDTO } from '@pwrprogram/shared';
import { Exercise } from '../entity/exercise';
import { handleMapperError } from '../utils/mapper.utils';

export function toExerciseDTO(entity: Exercise): ExerciseDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Exercise entity');
    }

    try {
        return plainToInstance(ExerciseDTO, {
            ...entity,
            _links: {
                self: `/api/sessions/${entity.sessionId}/exercises/${entity.id}`,
                session: `/api/sessions/${entity.sessionId}`,
                sets: `/api/exercises/${entity.id}/sets`,
            }
        }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Exercise', entity.id);
    }
}
