
export interface ProgramDTO {
    id: string;
    userId: string;
    name: string;
    description: string;
    completed: boolean;
}

export interface CycleDTO {
    id: string;
    programId: string;
    name: string;
    description?: string;
    goals?: string[];
    completed: boolean;
}

export interface BlockDTO {
    id: string;
    cycleId: string;
    name: string;
    description?: string;
    completed: boolean;
    goals?: string[];
    sessions_per_week: number;
}

export interface SessionDTO {
    id: string;
    blockId: string;
    name: string;
    description?: string;
    completed: boolean;
}

export interface ExerciseDTO {
    id: string;
    sessionId: string;
    name: string;
    description?: string;
    completed: boolean;
    tutorial_url?: string;
}

export interface SetDTO {
    id: string;
    exerciseId: string;
    target_reps?: number;
    target_weight?: number;
    target_percentage?: number;
    target_rpe?: number;
    actual_reps?: number;
    actual_weight?: number;
    actual_rpe?: number;
    completed?: boolean;
    tempo?: string; // Format "0:0:0"
    rest?: number; // In seconds
    notes?: string;
}