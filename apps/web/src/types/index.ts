// Types based on API responses

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  _links?: {
    self: string;
    programs: string;
    coach?: string;
  };
}

export interface Program {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coachId?: string;
  _links?: {
    self: string;
    cycles: string;
    coach?: string;
    user: string;
  };
}

export interface Cycle {
  id: string;
  programId: string;
  name: string;
  description?: string;
  order: number;
  _links?: {
    self: string;
    program: string;
    blocks: string;
  };
}

export interface Block {
  id: string;
  cycleId: string;
  name: string;
  description?: string;
  order: number;
  _links?: {
    self: string;
    cycle: string;
    sessions: string;
  };
}

export interface Session {
  id: string;
  blockId: string;
  name: string;
  description?: string;
  order: number;
  _links?: {
    self: string;
    block: string;
    exercises: string;
  };
}

export interface Exercise {
  id: string;
  sessionId: string;
  name: string;
  notes?: string;
  order: number;
  _links?: {
    self: string;
    session: string;
    sets: string;
  };
}

export interface Set {
  id: string;
  exerciseId: string;
  reps?: number;
  weight?: number;
  rpe?: number;
  notes?: string;
  order: number;
  _links?: {
    self: string;
    exercise: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
