// Central HATEOAS link builders. These operate on minimal shape objects to avoid tight coupling.

export function buildProgramLinks(p: { id: string; coachId?: string; userId: string }) {
    return {
        self: `/api/programs/${p.id}`,
        cycles: `/api/programs/${p.id}/cycles`,
        coach: p.coachId ? `/api/users/${p.coachId}` : undefined,
        user: `/api/users/${p.userId}`
    } as const;
}

export function buildCycleLinks(c: { id: string; programId: string }) {
    return {
        self: `/api/programs/${c.programId}/cycles/${c.id}`,
        program: `/api/programs/${c.programId}`,
        blocks: `/api/cycles/${c.id}/blocks`
    } as const;
}

export function buildBlockLinks(b: { id: string; cycleId: string }) {
    return {
        self: `/api/cycles/${b.cycleId}/blocks/${b.id}`,
        cycle: `/api/cycles/${b.cycleId}`,
        sessions: `/api/blocks/${b.id}/sessions`
    } as const;
}

export function buildSessionLinks(s: { id: string; blockId: string }) {
    return {
        self: `/api/blocks/${s.blockId}/sessions/${s.id}`,
        block: `/api/blocks/${s.blockId}`,
        exercises: `/api/sessions/${s.id}/exercises`
    } as const;
}

export function buildExerciseLinks(e: { id: string; sessionId: string }) {
    return {
        self: `/api/sessions/${e.sessionId}/exercises/${e.id}`,
        session: `/api/sessions/${e.sessionId}`,
        sets: `/api/exercises/${e.id}/sets`
    } as const;
}

export function buildSetLinks(s: { id: string; exerciseId: string }) {
    return {
        self: `/api/exercises/${s.exerciseId}/sets/${s.id}`,
        exercise: `/api/exercises/${s.exerciseId}`
    } as const;
}

export function buildUserLinks(u: { id: string }) {
    return {
        self: `/api/users/${u.id}`,
        programs: `/api/users/${u.id}/programs`
    } as const;
}
