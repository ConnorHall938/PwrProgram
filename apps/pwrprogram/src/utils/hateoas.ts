// server/src/utils/hateoas.ts
import { ProgramDTO, CycleDTO, BlockDTO, SessionDTO, ExerciseDTO } from '@pwrprogram/shared';

export function withProgramLinks(dto: ProgramDTO): ProgramDTO {
    return {
        ...dto,
        _links: {
            self: `/api/programs/${dto.id}`,
            cycles: `/api/programs/${dto.id}/cycles`,
            coach: dto.coachId ? `/api/users/${dto.coachId}` : undefined,
            user: `/api/users/${dto.userId}`
        }
    };
}

export function withCycleLinks(dto: CycleDTO): CycleDTO {
    return {
        ...dto,
        _links: {
            self: `/api/cycles/${dto.id}`,
            program: `/api/programs/${dto.programId}`,
            blocks: `/api/cycles/${dto.id}/blocks`
        }
    };
}

export function withBlockLinks(dto: BlockDTO): BlockDTO {
    return {
        ...dto,
        _links: {
            self: `/api/blocks/${dto.id}`,
            cycle: `/api/cycles/${dto.cycleId}`,
            sessions: `/api/blocks/${dto.id}/sessions`
        }
    };
}
export function withSessionLinks(dto: SessionDTO): SessionDTO {
    return {
        ...dto,
        _links: {
            self: `/api/sessions/${dto.id}`,
            block: `/api/blocks/${dto.blockId}`,
            exercises: `/api/sessions/${dto.id}/exercises`
        }
    };
}
export function withExerciseLinks(dto: ExerciseDTO): ExerciseDTO {
    return {
        ...dto,
        _links: {
            self: `/api/exercises/${dto.id}`,
            session: `/api/sessions/${dto.sessionId}`,
            sets: `/api/exercises/${dto.id}/sets`
        }
    };
}
