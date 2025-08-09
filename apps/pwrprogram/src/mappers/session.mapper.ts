import { plainToInstance } from 'class-transformer';
import { SessionDTO } from '@pwrprogram/shared';
import { Session } from '../entity/session';
import { handleMapperError } from '../utils/mapper.utils';
import { buildSessionLinks } from '../utils/hateoas';

export function toSessionDTO(entity: Session): SessionDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined Session entity');
    }

    try {
        return plainToInstance(SessionDTO, { ...entity, _links: buildSessionLinks(entity) }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'Session', entity.id);
    }
}
