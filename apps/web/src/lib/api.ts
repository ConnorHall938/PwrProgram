import type { User, Program, PaginatedResponse, ApiError } from '@/types';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An unexpected error occurred',
        statusCode: response.status,
      }));
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<User> {
    return this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // User endpoints
  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>
  ): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Program endpoints
  async getPrograms(page = 1, limit = 10): Promise<PaginatedResponse<Program>> {
    return this.request<PaginatedResponse<Program>>(
      `/programs?page=${page}&limit=${limit}`
    );
  }

  async getProgram(id: string): Promise<Program> {
    return this.request<Program>(`/programs/${id}`);
  }

  async createProgram(data: {
    name: string;
    description?: string;
  }): Promise<Program> {
    return this.request<Program>('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProgram(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Program> {
    return this.request<Program>(`/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProgram(id: string): Promise<void> {
    return this.request<void>(`/programs/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
