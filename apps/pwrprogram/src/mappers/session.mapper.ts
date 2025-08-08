import { plainToInstance } from 'class-transformer';
import { SessionDTO } from '@pwrprogram/shared';
import { Session } from '../entity/session';
import { handleMapperError } from '../utils/mapper.utils';

export function toSessionDTO(entity: Session): SessionDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Session entity');
    }

    try {
        return plainToInstance(SessionDTO, {
            ...entity,
            _links: {
                self: `/api/blocks/${entity.blockId}/sessions/${entity.id}`,
                block: `/api/blocks/${entity.blockId}`,
                exercises: `/api/sessions/${entity.id}/exercises`,
            }
        }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Session', entity.id);
    }
}
