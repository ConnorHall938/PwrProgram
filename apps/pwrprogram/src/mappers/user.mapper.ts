import { User } from '../entity/User';
import { UserResponseDTO } from '@pwrprogram/shared';
import { buildUserLinks } from '../utils/hateoas';

export function toUserDTO(entity: User): UserResponseDTO {
    if (!entity) {
        throw new Error('Cannot map null or undefined User entity');
    }

    const dto: UserResponseDTO = {
        id: entity.id,
        firstName: entity.firstName,
        email: entity.email,
        _links: buildUserLinks(entity)
    };
    if (entity.lastName != null) dto.lastName = entity.lastName;

    return dto;
}
