import { plainToInstance } from 'class-transformer';
import { CycleDTO } from '@pwrprogram/shared';
import { Cycle } from '../entity/cycle';

export function toCycleDTO(entity: Cycle): CycleDTO {
    return plainToInstance(CycleDTO, {
        ...entity,
        _links: {
            self: `/api/programs/${entity.programId}/cycles/${entity.id}`,
            program: `/api/programs/${entity.programId}`,
            blocks: `/api/cycles/${entity.id}/blocks`,
        }
    }, {
        excludeExtraneousValues: true
    });
}
