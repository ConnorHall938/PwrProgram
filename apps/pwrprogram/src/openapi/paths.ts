// Path objects separated for modular OpenAPI assembly
export const paths = {
    // ==================== Authentication Routes ====================
    '/api/auth/register': {
        post: {
            tags: ['Authentication'],
            summary: 'Register a new user',
            description: 'Creates a new user account with hashed password and automatically logs them in',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'password', 'firstName'],
                            properties: {
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string', minLength: 8 },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' }
                            }
                        },
                        examples: {
                            example: {
                                value: {
                                    email: 'john@example.com',
                                    password: 'securepass123',
                                    firstName: 'John',
                                    lastName: 'Doe'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'User registered successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    user: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', format: 'uuid' },
                                            email: { type: 'string' },
                                            firstName: { type: 'string' },
                                            lastName: { type: 'string' },
                                            isEmailVerified: { type: 'boolean' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error or email already exists',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'Login with email and password',
            description: 'Authenticates user and creates a session cookie',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'password'],
                            properties: {
                                email: { type: 'string', format: 'email' },
                                password: { type: 'string' }
                            }
                        },
                        examples: {
                            example: {
                                value: {
                                    email: 'john@example.com',
                                    password: 'securepass123'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Login successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    user: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', format: 'uuid' },
                                            email: { type: 'string' },
                                            firstName: { type: 'string' },
                                            lastName: { type: 'string' },
                                            isEmailVerified: { type: 'boolean' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Invalid credentials',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/logout': {
        post: {
            tags: ['Authentication'],
            summary: 'Logout current user',
            description: 'Destroys the session and clears the session cookie',
            responses: {
                200: {
                    description: 'Logout successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/me': {
        get: {
            tags: ['Authentication'],
            summary: 'Get current user',
            description: 'Returns the currently authenticated user information',
            security: [{ cookieAuth: [] }],
            responses: {
                200: {
                    description: 'Current user',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    user: { $ref: '#/components/schemas/UserResponseDTO' }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Not authenticated',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                }
            }
        }
    },

    // ==================== Users Routes ====================
    '/api/users/{id}': {
        get: {
            tags: ['Users'],
            summary: 'Get user by id',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                200: {
                    description: 'User found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserResponseDTO' }
                        }
                    }
                },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        },
        patch: {
            tags: ['Users'],
            summary: 'Update user profile',
            description: 'Update own profile (firstName, lastName, email, password). Users can only update their own profile.',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateUserDTO' },
                        examples: {
                            updateProfile: {
                                summary: 'Update name',
                                value: {
                                    firstName: 'Jane',
                                    lastName: 'Smith'
                                }
                            },
                            changePassword: {
                                summary: 'Change password',
                                value: {
                                    currentPassword: 'oldpass123',
                                    newPassword: 'newpass456'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'User updated',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserResponseDTO' }
                        }
                    }
                },
                400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                403: { description: 'Forbidden - can only update own profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        },
        delete: {
            tags: ['Users'],
            summary: 'Delete user account (soft delete)',
            description: 'Soft deletes the user account. Users can only delete their own account.',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                204: { description: 'User deleted' },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                403: { description: 'Forbidden - can only delete own account', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    },
    '/api/users': {
        get: {
            tags: ['Users'],
            summary: 'List users with pagination',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', default: 1, minimum: 1 },
                    description: 'Page number'
                },
                {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
                    description: 'Items per page (max 100)'
                }
            ],
            responses: {
                200: {
                    description: 'List of users with pagination',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/UserResponseDTO' }
                                    },
                                    pagination: { $ref: '#/components/schemas/PaginationResponse' }
                                }
                            }
                        }
                    }
                },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        },
        post: {
            tags: ['Users'],
            summary: 'Create user (admin)',
            description: 'Create a new user. Note: Regular users should use /auth/register',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateUserDTO' }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Created',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserResponseDTO' }
                        }
                    }
                },
                400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    },

    // ==================== Programs Routes ====================
    '/api/programs': {
        get: {
            tags: ['Programs'],
            summary: 'List user programs with pagination',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', default: 1, minimum: 1 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
                }
            ],
            responses: {
                200: {
                    description: 'List of programs',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/ProgramResponseDTO' }
                                    },
                                    pagination: { $ref: '#/components/schemas/PaginationResponse' }
                                }
                            }
                        }
                    }
                },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        },
        post: {
            tags: ['Programs'],
            summary: 'Create program',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateProgramDTO' }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Created',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ProgramResponseDTO' }
                        }
                    }
                },
                400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    },
    '/api/programs/{id}': {
        get: {
            tags: ['Programs'],
            summary: 'Get program by id',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                200: {
                    description: 'Program found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ProgramResponseDTO' }
                        }
                    }
                },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        },
        delete: {
            tags: ['Programs'],
            summary: 'Delete program (soft delete)',
            description: 'Soft deletes a program. Users can only delete their own programs.',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' }
                }
            ],
            responses: {
                204: { description: 'Program deleted' },
                401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    }
};
