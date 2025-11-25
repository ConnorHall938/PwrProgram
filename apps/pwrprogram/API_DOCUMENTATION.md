# PwrProgram API Documentation

## Overview

The PwrProgram API is a REST API for managing workout programs, cycles, blocks, sessions, exercises, and sets. It uses session-based authentication and follows RESTful principles.

**Base URL**: `/api`

**Authentication**: Session-based authentication using cookies

**Response Format**: JSON

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Programs](#programs)
4. [Cycles](#cycles)
5. [Blocks](#blocks)
6. [Sessions](#sessions)
7. [Exercises](#exercises)
8. [Sets](#sets)
9. [Error Responses](#error-responses)

---

## Authentication

All authentication endpoints are public and do not require authentication.

### POST /auth/register

Register a new user and automatically log them in.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation:**
- `email`: Must be a valid email address (required)
- `password`: Minimum 6 characters (required)
- `firstName`: String (required)
- `lastName`: String (optional)

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
  ```json
  {
    "error": "Validation failed",
    "errors": {
      "email": ["email must be an email"],
      "password": ["password must be longer than or equal to 6 characters"]
    }
  }
  ```
- `400 Bad Request`: Email already exists
  ```json
  {
    "error": "Email already exists"
  }
  ```

---

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "error": "Invalid email or password"
  }
  ```

---

### POST /auth/logout

Logout the current user and destroy their session.

**Success Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

---

### GET /auth/me

Get the currently authenticated user's information.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
  ```json
  {
    "error": "Not authenticated"
  }
  ```

---

## Users

All user endpoints require authentication except for registration.

### GET /users

Get a paginated list of all users.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "_links": {
        "self": "/api/users/uuid",
        "programs": "/api/programs?userId=uuid"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### GET /users/:id

Get a specific user by ID.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "_links": {
    "self": "/api/users/uuid",
    "programs": "/api/programs?userId=uuid"
  }
}
```

**Error Responses:**
- `404 Not Found`: User not found
  ```json
  {
    "error": "User not found"
  }
  ```

---

### POST /users

Create a new user (admin function - for testing purposes).

**Authentication:** Required

**Note:** Regular users should use `/auth/register` instead.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "_links": {
    "self": "/api/users/uuid",
    "programs": "/api/programs?userId=uuid"
  }
}
```

---

### PATCH /users/:id

Update user profile. Users can only update their own profile.

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "email": "newemail@example.com",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Notes:**
- All fields are optional
- To change password, both `currentPassword` and `newPassword` are required
- `newPassword` must be at least 8 characters
- Changing email resets `isEmailVerified` to false

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "newemail@example.com",
  "firstName": "Johnny",
  "lastName": "Doe",
  "_links": {
    "self": "/api/users/uuid",
    "programs": "/api/programs?userId=uuid"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Current password required
  ```json
  {
    "error": "Current password is required to set a new password"
  }
  ```
- `401 Unauthorized`: Incorrect current password
  ```json
  {
    "error": "Current password is incorrect"
  }
  ```
- `400 Bad Request`: Email already exists
  ```json
  {
    "error": "Email already exists"
  }
  ```
- `403 Forbidden`: Cannot update another user's profile
  ```json
  {
    "error": "You can only update your own profile"
  }
  ```

---

### DELETE /users/:id

Soft delete a user account. Users can only delete their own account.

**Authentication:** Required

**Success Response (204 No Content)**

**Error Responses:**
- `403 Forbidden`: Cannot delete another user's account
  ```json
  {
    "error": "You can only delete your own account"
  }
  ```
- `404 Not Found`: User not found

---

## Programs

All program endpoints require authentication.

### GET /programs

Get all programs for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Strength Training Phase 1",
      "description": "8-week strength building program",
      "userId": "uuid",
      "_links": {
        "self": "/api/programs/uuid",
        "cycles": "/api/programs/uuid/cycles",
        "user": "/api/users/uuid"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /programs/:id

Get a specific program. Must belong to the authenticated user.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Strength Training Phase 1",
  "description": "8-week strength building program",
  "userId": "uuid",
  "_links": {
    "self": "/api/programs/uuid",
    "cycles": "/api/programs/uuid/cycles",
    "user": "/api/users/uuid"
  }
}
```

**Error Responses:**
- `404 Not Found`: Program not found or doesn't belong to user

---

### POST /programs

Create a new program for the authenticated user.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Hypertrophy Program",
  "description": "12-week muscle building program",
  "coachId": "uuid-optional"
}
```

**Validation:**
- `name`: String, required
- `description`: String, optional
- `coachId`: UUID, optional

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Hypertrophy Program",
  "description": "12-week muscle building program",
  "userId": "uuid",
  "_links": {
    "self": "/api/programs/uuid",
    "cycles": "/api/programs/uuid/cycles",
    "user": "/api/users/uuid"
  }
}
```

---

### DELETE /programs/:id

Soft delete a program. Must belong to the authenticated user.

**Authentication:** Required

**Success Response (204 No Content)**

**Error Responses:**
- `404 Not Found`: Program not found or doesn't belong to user

---

## Cycles

All cycle endpoints require authentication.

### GET /programs/:programId/cycles

Get all cycles for a specific program.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cycle 1: Foundation",
      "description": "Building base strength",
      "programId": "uuid",
      "completed": false,
      "_links": {
        "self": "/api/cycles/uuid",
        "program": "/api/programs/uuid",
        "blocks": "/api/cycles/uuid/blocks"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### GET /cycles/:id

Get a specific cycle. Must belong to the authenticated user's program.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Cycle 1: Foundation",
  "description": "Building base strength",
  "programId": "uuid",
  "completed": false,
  "_links": {
    "self": "/api/cycles/uuid",
    "program": "/api/programs/uuid",
    "blocks": "/api/cycles/uuid/blocks"
  }
}
```

---

### POST /programs/:programId/cycles

Create a new cycle for a program.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Cycle 2: Volume",
  "description": "Increasing training volume",
  "completed": false
}
```

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Cycle 2: Volume",
  "description": "Increasing training volume",
  "programId": "uuid",
  "completed": false,
  "_links": {
    "self": "/api/cycles/uuid",
    "program": "/api/programs/uuid",
    "blocks": "/api/cycles/uuid/blocks"
  }
}
```

---

### PATCH /cycles/:id

Update a cycle.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Cycle 2: High Volume",
  "description": "Updated description",
  "completed": true
}
```

**Success Response (200 OK)**

---

### DELETE /cycles/:id

Soft delete a cycle.

**Authentication:** Required

**Success Response (204 No Content)**

---

## Blocks

All block endpoints require authentication.

### GET /cycles/:cycleId/blocks

Get all blocks for a specific cycle.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Block 1: Base Building",
      "description": "Foundation work",
      "cycleId": "uuid",
      "completed": false,
      "goals": ["Increase volume", "Build work capacity"],
      "sessionsPerWeek": 4,
      "_links": {
        "self": "/api/blocks/uuid",
        "cycle": "/api/cycles/uuid",
        "sessions": "/api/blocks/uuid/sessions"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### GET /blocks/:id

Get a specific block.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Block 1: Base Building",
  "description": "Foundation work",
  "cycleId": "uuid",
  "completed": false,
  "goals": ["Increase volume", "Build work capacity"],
  "sessionsPerWeek": 4,
  "_links": {
    "self": "/api/blocks/uuid",
    "cycle": "/api/cycles/uuid",
    "sessions": "/api/blocks/uuid/sessions"
  }
}
```

---

### POST /cycles/:cycleId/blocks

Create a new block for a cycle.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Block 2: Intensification",
  "description": "Increasing intensity",
  "completed": false,
  "goals": ["Peak strength", "Reduce volume"],
  "sessionsPerWeek": 3
}
```

**Validation:**
- `sessionsPerWeek`: Must be >= 1

**Success Response (201 Created)**

---

### PATCH /blocks/:id

Update a block.

**Authentication:** Required

**Request Body:** Same as POST

**Success Response (200 OK)**

---

### DELETE /blocks/:id

Soft delete a block.

**Authentication:** Required

**Success Response (204 No Content)**

---

## Sessions

All session endpoints require authentication.

### GET /blocks/:blockId/sessions

Get all sessions for a specific block.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Session 1: Upper Body",
      "description": "Chest and back focus",
      "blockId": "uuid",
      "completed": false,
      "_links": {
        "self": "/api/sessions/uuid",
        "block": "/api/blocks/uuid",
        "exercises": "/api/sessions/uuid/exercises"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### GET /sessions/:id

Get a specific session.

**Authentication:** Required

**Success Response (200 OK)**

---

### POST /blocks/:blockId/sessions

Create a new session for a block.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Session 2: Lower Body",
  "description": "Squat and deadlift focus",
  "completed": false
}
```

**Success Response (201 Created)**

---

### PATCH /sessions/:id

Update a session.

**Authentication:** Required

**Success Response (200 OK)**

---

### DELETE /sessions/:id

Soft delete a session.

**Authentication:** Required

**Success Response (204 No Content)**

---

## Exercises

All exercise endpoints require authentication.

### GET /sessions/:sessionId/exercises

Get all exercises for a specific session.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Bench Press",
      "description": "Barbell bench press",
      "sessionId": "uuid",
      "orderIndex": 0,
      "targetSets": 4,
      "targetReps": 8,
      "targetRPE": 8.0,
      "notes": "Focus on bar path",
      "_links": {
        "self": "/api/exercises/uuid",
        "session": "/api/sessions/uuid",
        "sets": "/api/exercises/uuid/sets"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /exercises/:id

Get a specific exercise.

**Authentication:** Required

**Success Response (200 OK)**

---

### POST /sessions/:sessionId/exercises

Create a new exercise for a session.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Squat",
  "description": "Back squat",
  "orderIndex": 1,
  "targetSets": 3,
  "targetReps": 5,
  "targetRPE": 9.0,
  "notes": "High bar position"
}
```

**Success Response (201 Created)**

---

### PATCH /exercises/:id

Update an exercise.

**Authentication:** Required

**Success Response (200 OK)**

---

### DELETE /exercises/:id

Soft delete an exercise.

**Authentication:** Required

**Success Response (204 No Content)**

---

## Sets

All set endpoints require authentication.

### GET /exercises/:exerciseId/sets

Get all sets for a specific exercise.

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "exerciseId": "uuid",
      "setNumber": 1,
      "weight": 225.0,
      "reps": 8,
      "rpe": 8.0,
      "notes": "Felt strong",
      "_links": {
        "self": "/api/sets/uuid",
        "exercise": "/api/exercises/uuid"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

---

### GET /sets/:id

Get a specific set.

**Authentication:** Required

**Success Response (200 OK)**

---

### POST /exercises/:exerciseId/sets

Create a new set for an exercise.

**Authentication:** Required

**Request Body:**
```json
{
  "setNumber": 2,
  "weight": 225.0,
  "reps": 8,
  "rpe": 8.5,
  "notes": "Good form"
}
```

**Validation:**
- `weight`: Must be >= 0
- `reps`: Must be >= 0
- `rpe`: Must be between 0 and 10

**Success Response (201 Created)**

---

### PATCH /sets/:id

Update a set.

**Authentication:** Required

**Success Response (200 OK)**

---

### DELETE /sets/:id

Soft delete a set.

**Authentication:** Required

**Success Response (204 No Content)**

---

## Error Responses

### Common Error Codes

- **400 Bad Request**: Invalid request data or validation failed
- **401 Unauthorized**: Not authenticated or invalid credentials
- **403 Forbidden**: Authenticated but not authorized to access resource
- **404 Not Found**: Resource not found or doesn't belong to user
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "error": "Error message describing what went wrong"
}
```

### Validation Error Format

```json
{
  "error": "Validation failed",
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"]
  }
}
```

---

## Rate Limiting

- Rate limiting is applied to all `/api/*` endpoints
- Default: 100 requests per 15 minutes per IP address
- Rate limit info is returned in response headers:
  - `RateLimit-Limit`: Maximum requests allowed
  - `RateLimit-Remaining`: Requests remaining
  - `RateLimit-Reset`: Time when limit resets

---

## Pagination

All list endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Pagination responses include:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## HATEOAS Links

Most resources include `_links` for navigation:

```json
{
  "_links": {
    "self": "/api/resource/uuid",
    "parent": "/api/parent/uuid",
    "related": "/api/resource/uuid/related"
  }
}
```
