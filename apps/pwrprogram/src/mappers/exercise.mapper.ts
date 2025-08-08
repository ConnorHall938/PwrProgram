import { plainToInstance } from 'class-transformer';
import { ExerciseDTO } from '@pwrprogram/shared';
import { Exercise } from '../entity/exercise';

export function toExerciseDTO(entity: Exercise): ExerciseDTO {
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
}
