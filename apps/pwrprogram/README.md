# PwrProgram API

A production-ready REST API for fitness program management with secure authentication.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm migration:run

# Start development server
pnpm start:dev

# Run tests
pnpm test
```

## Authentication

The API uses **session-based authentication** with HTTP-only cookies.

### Registration

Create a new user account:

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
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

After registration, the user is automatically logged in with a session cookie set.

---

### Login (Sign In)

Authenticate with email and password:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
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

A session cookie is automatically set in the response headers.

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

### Get Current User

Get information about the currently authenticated user:

```bash
GET /api/auth/me
Cookie: connect.sid=<session-cookie>
```

**Response (200 OK):**
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

---

### Logout (Sign Out)

Destroy the current session:

```bash
POST /api/auth/logout
Cookie: connect.sid=<session-cookie>
```

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

The session cookie is cleared.

---

## Using Authentication in Requests

Once logged in, all protected endpoints require the session cookie to be included:

```bash
# Example: Get user's programs
GET /api/programs
Cookie: connect.sid=<session-cookie>
```

Most HTTP clients (curl, Postman, browsers) automatically handle cookies. The session cookie is:
- **HTTP-only**: Cannot be accessed via JavaScript (prevents XSS)
- **Secure**: Only sent over HTTPS in production
- **SameSite=lax**: CSRF protection

---

## Authorization

The API implements resource-based authorization:

- **Users** can only access/modify their own profile
- **Programs** can only be accessed by their owner
- **Nested resources** (Cycles, Blocks, Sessions, Exercises, Sets) inherit ownership from their parent Program

Example authorization checks:
- `PATCH /api/users/:id` - User can only update their own profile (userId must match session userId)
- `GET /api/programs/:id` - User can only view their own programs
- `DELETE /api/cycles/:id` - User can only delete cycles belonging to their programs

**Error Responses:**
- `401 Unauthorized` - Not authenticated (no valid session)
- `403 Forbidden` - Authenticated but not authorized to access resource
- `404 Not Found` - Resource not found OR doesn't belong to user (security through obscurity)

---

## API Documentation

Full API documentation is available in multiple formats:

### 📄 Markdown Documentation
Complete API reference with examples: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 🔗 Interactive Swagger UI
Start the server and visit: **http://localhost:3000/docs**

### 📋 OpenAPI Spec
The OpenAPI 3.0 specification is available at:
- Programmatic access: `http://localhost:3000/docs` (JSON format)
- Source files: `src/openapi/`

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pwrprogram

# Session
SESSION_SECRET=your-secret-key-here
SESSION_NAME=pwrprogram.sid
SESSION_MAX_AGE=604800000  # 7 days in milliseconds

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # requests per window

# Server
PORT=3000
NODE_ENV=development
```

---

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test user.test.ts

# Run with coverage
pnpm test:coverage
```

All tests use the session-based authentication via the `createAuthenticatedSession` helper.

---

## Security Features

- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Session Management**: TypeORM session store with cleanup
- ✅ **HTTP-Only Cookies**: Prevents XSS attacks
- ✅ **CSRF Protection**: SameSite cookie attribute
- ✅ **Rate Limiting**: Per-IP request throttling
- ✅ **Input Validation**: class-validator DTOs
- ✅ **SQL Injection Prevention**: TypeORM parameterized queries
- ✅ **Security Headers**: Helmet.js middleware
- ✅ **Soft Deletes**: Data retention and audit trail

---

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Programs
- `GET /api/programs` - List user's programs
- `POST /api/programs` - Create program
- `GET /api/programs/:id` - Get program
- `DELETE /api/programs/:id` - Delete program

### Cycles
- `GET /api/programs/:programId/cycles` - List cycles
- `POST /api/programs/:programId/cycles` - Create cycle
- `GET /api/cycles/:id` - Get cycle
- `PATCH /api/cycles/:id` - Update cycle
- `DELETE /api/cycles/:id` - Delete cycle

### Blocks
- `GET /api/cycles/:cycleId/blocks` - List blocks
- `POST /api/cycles/:cycleId/blocks` - Create block
- `GET /api/blocks/:id` - Get block
- `PATCH /api/blocks/:id` - Update block
- `DELETE /api/blocks/:id` - Delete block

### Sessions
- `GET /api/blocks/:blockId/sessions` - List sessions
- `POST /api/blocks/:blockId/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `PATCH /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Exercises
- `GET /api/sessions/:sessionId/exercises` - List exercises
- `POST /api/sessions/:sessionId/exercises` - Create exercise
- `GET /api/exercises/:id` - Get exercise
- `PATCH /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Sets
- `GET /api/exercises/:exerciseId/sets` - List sets
- `POST /api/exercises/:exerciseId/sets` - Create set
- `GET /api/sets/:id` - Get set
- `PATCH /api/sets/:id` - Update set
- `DELETE /api/sets/:id` - Delete set

---

For complete endpoint details, request/response examples, and error codes, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
