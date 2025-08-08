import { plainToInstance } from 'class-transformer';
import { SessionDTO } from '@pwrprogram/shared';
import { Session } from '../entity/session';

export function toSessionDTO(entity: Session): SessionDTO {
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
}
