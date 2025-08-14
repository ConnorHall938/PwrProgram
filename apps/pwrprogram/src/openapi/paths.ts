// Path objects separated for modular OpenAPI assembly
export const paths = {
    '/api/users/{id}': {
        get: {
            tags: ['Users'],
            summary: 'Get user by id',
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
                            schema: { $ref: '#/components/schemas/UserResponseDTO' },
                            examples: {
                                example: {
                                    value: {
                                        id: 'b3d5e6f4-1234-4c2a-9f1d-111111111111',
                                        firstName: 'Alex',
                                        lastName: 'Smith',
                                        email: 'alex@example.com',
                                        _links: {
                                            self: '/api/users/b3d5e6f4-1234-4c2a-9f1d-111111111111',
                                            programs: '/api/users/b3d5e6f4-1234-4c2a-9f1d-111111111111/programs'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: { notFound: { value: { message: 'User not found' } } }
                        }
                    }
                }
            }
        }
    },
    '/api/users': {
        get: {
            tags: ['Users'],
            summary: 'List users',
            responses: {
                200: {
                    description: 'List of users',
                    content: {
                        'application/json': {
                            schema: { type: 'array', items: { $ref: '#/components/schemas/UserResponseDTO' } },
                            examples: {
                                example: {
                                    value: [
                                        { id: 'b3d5e6f4-1234-4c2a-9f1d-111111111111', firstName: 'Alex', email: 'alex@example.com' }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        post: {
            tags: ['Users'],
            summary: 'Create user',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateUserDTO' },
                        examples: {
                            example: {
                                value: {
                                    firstName: 'Alex',
                                    lastName: 'Smith',
                                    email: 'alex@example.com',
                                    password: 'Secret123'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Created',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserResponseDTO' },
                            examples: {
                                created: {
                                    value: {
                                        id: 'b3d5e6f4-1234-4c2a-9f1d-111111111111',
                                        firstName: 'Alex',
                                        email: 'alex@example.com'
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation / duplicate error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: {
                                duplicate: { value: { message: 'Email already exists' } },
                                validation: { value: { message: 'Validation failed' } }
                            }
                        }
                    }
                },
                500: {
                    description: 'Server error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            examples: {
                                serverError: { value: { message: 'Internal server error' } }
                            }
                        }
                    }
                }
            }
        }
    },
    // Programs
    '/api/programs/{id}': {
        get: {
            tags: ['Programs'],
            summary: 'Get program by id',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
            ],
            responses: {
                200: {
                    description: 'Program found',
                    content: {
                        'application/json': {
                            schema: { type: 'object' },
                            examples: {
                                example: {
                                    value: {
                                        id: '11111111-1111-1111-1111-111111111111',
                                        userId: '22222222-2222-2222-2222-222222222222',
                                        name: 'Strength Focus',
                                        description: '12 week strength block'
                                    }
                                }
                            }
                        }
                    }
                },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    },
    '/api/programs': {
        get: {
            tags: ['Programs'],
            summary: 'List programs',
            responses: {
                200: {
                    description: 'List of programs',
                    content: {
                        'application/json': {
                            schema: { type: 'array', items: { type: 'object' } },
                            examples: { example: { value: [{ id: '111', name: 'Strength Focus' }] } }
                        }
                    }
                }
            }
        },
        post: {
            tags: ['Programs'],
            summary: 'Create program',
            requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProgramDTO' } } }
            },
            responses: {
                201: { description: 'Created', content: { 'application/json': { schema: { type: 'object' } } } },
                400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    },
    // Cycles (note: current routing structure duplicates /cycles segment for create/list)
    '/api/cycles/{id}': {
        get: {
            tags: ['Cycles'],
            summary: 'Get cycle by id',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: {
                200: { description: 'Cycle found', content: { 'application/json': { schema: { type: 'object' } } } },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        },
        patch: {
            tags: ['Cycles'],
            summary: 'Update cycle',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCycleDTO' } } } },
            responses: {
                200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object' } } } },
                404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
        }
    },
    '/api/programs/{programId}/cycles': {
        get: {
            tags: ['Cycles'],
            summary: 'List cycles for program',
            parameters: [{ name: 'programId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } }
        },
        post: {
            tags: ['Cycles'],
            summary: 'Create cycle (under program)',
            parameters: [{ name: 'programId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCycleDTO' } } } },
            responses: { 201: { description: 'Created', content: { 'application/json': { schema: { type: 'object' } } } } }
        }
    },
    // Blocks
    '/api/blocks/{id}': {
        get: {
            tags: ['Blocks'],
            summary: 'Get block by id',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            responses: { 200: { description: 'Block found', content: { 'application/json': { schema: { type: 'object' } } } }, 404: { description: 'Not found' } }
        },
        patch: {
            tags: ['Blocks'],
            summary: 'Update block',
            parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
            requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBlockDTO' } } } },
            responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object' } } } }, 404: { description: 'Not found' } }
        }
    },
    '/api/blocks/{cycleId}/blocks': {
        get: { tags: ['Blocks'], summary: 'List blocks for cycle', parameters: [{ name: 'cycleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
        post: { tags: ['Blocks'], summary: 'Create block (under cycle)', parameters: [{ name: 'cycleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBlockDTO' } } } }, responses: { 201: { description: 'Created', content: { 'application/json': { schema: { type: 'object' } } } } } }
    },
    // Sessions
    '/api/sessions/{id}': {
        get: { tags: ['Sessions'], summary: 'Get session by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Found', content: { 'application/json': { schema: { type: 'object' } } } }, 404: { description: 'Not found' } } },
        patch: { tags: ['Sessions'], summary: 'Update session', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSessionDTO' } } } }, responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } } }
    },
    '/api/blocks/{blockId}/sessions': {
        get: { tags: ['Sessions'], summary: 'List sessions for block', parameters: [{ name: 'blockId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
        post: { tags: ['Sessions'], summary: 'Create session (under block)', parameters: [{ name: 'blockId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSessionDTO' } } } }, responses: { 201: { description: 'Created' } } }
    },
    // Exercises
    '/api/exercises/{id}': {
        get: { tags: ['Exercises'], summary: 'Get exercise by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Found' }, 404: { description: 'Not found' } } },
        patch: { tags: ['Exercises'], summary: 'Update exercise', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateExerciseDTO' } } } }, responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } } }
    },
    '/api/sessions/{sessionId}/exercises': {
        get: { tags: ['Exercises'], summary: 'List exercises for session', parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
        post: { tags: ['Exercises'], summary: 'Create exercise (under session)', parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateExerciseDTO' } } } }, responses: { 201: { description: 'Created' } } }
    },
    // Sets
    '/api/sets/{id}': {
        get: { tags: ['Sets'], summary: 'Get set by id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Found' }, 404: { description: 'Not found' } } },
        patch: { tags: ['Sets'], summary: 'Update set', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSetDTO' } } } }, responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } } }
    },
    '/api/exercises/{exerciseId}/sets': {
        get: { tags: ['Sets'], summary: 'List sets for exercise', parameters: [{ name: 'exerciseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } } } },
        post: { tags: ['Sets'], summary: 'Create set (under exercise)', parameters: [{ name: 'exerciseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSetDTO' } } } }, responses: { 201: { description: 'Created' } } }
    }
};
