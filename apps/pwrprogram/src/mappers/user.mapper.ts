import { User } from '../entity/User';
import { UserResponseDTO } from '@pwrprogram/shared';

export function toUserDTO(entity: User): UserResponseDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined User entity');
    }

    const dto: UserResponseDTO = {
        id: entity.id,
        firstName: entity.firstName,
        email: entity.email,
        _links: {
            self: `/api/users/${entity.id}`,
            programs: `/api/users/${entity.id}/programs`
        }
    };
    if (entity.lastName != null) dto.lastName = entity.lastName;

    return dto;
}
