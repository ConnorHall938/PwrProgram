import { User } from '../entity/User';
import { UserResponseDTO } from '@pwrprogram/shared';
import { plainToInstance } from 'class-transformer';
import { handleMapperError } from '../utils/mapper.utils';

export function toUserDTO(entity: User): UserResponseDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined User entity');
    }

    try {
        return plainToInstance(UserResponseDTO, {
            ...entity,
            _links: {
                self: `/api/users/${entity.id}`,
                programs: `/api/users/${entity.id}/programs`
            }
        }, {
            excludeExtraneousValues: true
        });
    } catch (error) {
        handleMapperError(error, 'User', entity.id);
    }
}
