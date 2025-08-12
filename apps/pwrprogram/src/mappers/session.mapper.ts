import { SessionDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';

import { Session } from '../entity';
import { buildSessionLinks } from '../utils/hateoas';
import { handleMapperError } from '../utils/mapper.utils';

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
