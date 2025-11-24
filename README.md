# PwrProgram

A comprehensive fitness program management API built with TypeScript, Node.js, and PostgreSQL. Manage workout programs, cycles, blocks, sessions, exercises, and sets with a hierarchical structure designed for coaches and athletes.

## 🚀 Features

### Core Functionality
- **User Management**: Secure authentication, profile management, password hashing with bcrypt
- **Program Hierarchy**: Users > Programs > Cycles > Blocks > Sessions > Exercises > Sets
- **CRUD Operations**: Full Create, Read, Update, Delete (soft delete) support for all resources
- **Pagination**: Efficient data retrieval with configurable page sizes
- **HATEOAS**: Discoverable REST API with hypermedia links

### Security
- ✅ **Password Hashing**: Bcrypt with configurable rounds
- ✅ **Session Management**: Database-backed sessions (TypeORM store, scalable to Redis)
- ✅ **Authentication**: Secure session-based auth on all protected endpoints
- ✅ **Security Headers**: Helmet.js for XSS, clickjacking protection
- ✅ **Rate Limiting**: Configurable request limits per IP
- ✅ **CORS**: Whitelist-based cross-origin resource sharing
- ✅ **Input Validation**: class-validator decorators on all DTOs
- ✅ **SQL Injection Protection**: TypeORM parameterized queries
- ✅ **Soft Deletes**: Data retention with soft delete support

### Developer Experience
- **TypeScript**: Full type safety throughout
- **OpenAPI/Swagger**: Interactive API documentation at `/docs`
- **Structured Logging**: Winston with file and console transports
- **Error Handling**: Standardized error responses, production-safe messages
- **Environment Variables**: Secure configuration with `.env` support
- **Database Migrations**: Ready for production (currently using sync for dev)
- **Comprehensive Tests**: Integration test suite with Jest
- **Monorepo Structure**: PNPM workspaces for shared code

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🔧 Prerequisites

- **Node.js**: >= 18.x
- **PNPM**: >= 8.x
- **PostgreSQL**: >= 14.x
- **Docker** (optional): For containerized deployment

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PwrProgram
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example apps/pwrprogram/.env
   ```

   Edit `apps/pwrprogram/.env` with your configuration (see [Configuration](#configuration))

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb pwrprogram

   # Or use Docker
   docker run --name pwrprogram-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
   ```

5. **Start the development server**
   ```bash
   pnpm --filter @pwrprogram/api dev
   ```

   The API will be available at `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

All configuration is done through environment variables. Copy `.env.example` to `.env` and configure:

#### Application Settings
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `API_BASE_URL`: Base URL for the API

#### Database
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name

#### Security
- `SESSION_SECRET`: **REQUIRED** - Secret key for session signing (min 32 characters)
- `SESSION_NAME`: Cookie name (default: pwrprogram.sid)
- `SESSION_MAX_AGE`: Session duration in ms (default: 604800000 = 7 days)
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 10)

#### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: Time window in ms (default: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

#### CORS
- `CORS_ORIGIN`: Allowed origins, comma-separated (default: http://localhost:3000,http://localhost:5173)

#### Logging
- `LOG_LEVEL`: Logging level (default: info)
- `LOG_FILE_PATH`: Log file location (default: logs/app.log)

#### Email (Future Feature)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: Email configuration
- `FRONTEND_URL`: Frontend URL for email links

### Required Environment Variables

⚠️ **Critical**: These variables MUST be set or the application will not start:
- `DB_HOST`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `SESSION_SECRET`

## 🏃 Running the Application

### Development
```bash
# Start dev server with hot reload
pnpm --filter @pwrprogram/api dev

# Run tests
pnpm --filter @pwrprogram/api test

# Run tests with coverage
pnpm --filter @pwrprogram/api test:coverage

# Lint code
pnpm --filter @pwrprogram/api lint
```

### Production
```bash
# Build the application
pnpm --filter @pwrprogram/api build

# Start production server
pnpm --filter @pwrprogram/api start
```

### Docker
```bash
# Build image
docker build -t pwrprogram .

# Run container
docker run -p 3000:3000 --env-file .env pwrprogram
```

## 📚 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/docs` for interactive Swagger UI documentation.

### Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication

### Registration
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

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Check Authentication
```bash
GET /api/auth/me
```

### Logout
```bash
POST /api/auth/logout
```

### Update Profile
```bash
PATCH /api/users/:id
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

### Change Password
```bash
PATCH /api/users/:id
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

### Authentication Flow
1. Register or login to receive a session cookie
2. Browser automatically sends cookie with subsequent requests
3. All `/api/*` endpoints (except `/api/auth/*`) require authentication
4. Session expires after 7 days (configurable)

## 📍 API Endpoints

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/logout` | Logout current user |
| GET | `/api/auth/me` | Get current user info |

### Users (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user (admin) |
| PATCH | `/api/users/:id` | Update own profile |
| DELETE | `/api/users/:id` | Delete own account (soft delete) |

### Programs (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | List user's programs |
| GET | `/api/programs/:id` | Get program by ID |
| POST | `/api/programs` | Create new program |
| PATCH | `/api/programs/:id` | Update program |
| DELETE | `/api/programs/:id` | Delete program (soft delete) |

### Cycles, Blocks, Sessions, Exercises, Sets
Similar CRUD operations available for all resources. See Swagger docs for details.

### Pagination
All list endpoints support pagination:
```bash
GET /api/users?page=1&limit=20
```

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## 🗄️ Database Schema

### Entity Relationships
```
User (1) ─── (N) Program
                   │
                   └─ (1) ─── (N) Cycle
                                   │
                                   └─ (1) ─── (N) Block
                                                   │
                                                   └─ (1) ─── (N) Session
                                                                   │
                                                                   └─ (1) ─── (N) Exercise
                                                                                   │
                                                                                   └─ (1) ─── (N) Set
```

### Key Features
- **Soft Deletes**: All entities have `deletedAt` timestamp
- **Timestamps**: `createdAt` and `updatedAt` on all entities
- **Cascade Deletes**: Deleting parent cascades to children
- **Indexes**: Foreign keys and email fields indexed
- **UUID Primary Keys**: For better distribution and security

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pnpm --filter @pwrprogram/api test

# Run with coverage
pnpm --filter @pwrprogram/api test:coverage

# Run specific test file
pnpm --filter @pwrprogram/api test user.test
```

### Test Structure
```
src/testing/
├── tests/
│   └── routes/          # Integration tests for each route
├── utils/
│   ├── test-data-source.ts    # Test database configuration
│   └── test-helper.ts          # Test utilities
└── setup.ts             # Jest setup
```

### Writing Tests
```typescript
import { testHelper } from '../utils/test-helper';

describe('Users API', () => {
  beforeAll(async () => {
    await testHelper.initialize();
  });

  afterAll(async () => {
    await testHelper.cleanup();
  });

  it('should create a user', async () => {
    const response = await testHelper.request
      .post('/api/users')
      .send({ email: 'test@example.com', ... });

    expect(response.status).toBe(201);
  });
});
```

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**
   - [ ] Set strong `SESSION_SECRET` (min 32 chars)
   - [ ] Configure production database
   - [ ] Set `NODE_ENV=production`
   - [ ] Configure CORS for your domain
   - [ ] Set up email SMTP (when ready)

2. **Database**
   - [ ] Run database migrations (when implemented)
   - [ ] Set up automated backups
   - [ ] Configure connection pooling

3. **Security**
   - [ ] Use HTTPS (set `secure: true` on cookies)
   - [ ] Configure firewall rules
   - [ ] Set up monitoring and alerts
   - [ ] Review rate limiting settings

4. **Logging**
   - [ ] Configure log aggregation service
   - [ ] Set appropriate log levels
   - [ ] Set up error tracking (e.g., Sentry)

### Docker Deployment
```bash
# Build
docker build -t pwrprogram:latest .

# Run
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name pwrprogram \
  pwrprogram:latest
```

### Scaling Considerations
- **Session Store**: Migrate to Redis for horizontal scaling
  ```typescript
  // In production, replace TypeormStore with RedisStore
  import RedisStore from 'connect-redis';
  import { createClient } from 'redis';

  const redisClient = createClient();
  store: new RedisStore({ client: redisClient });
  ```

- **Database**: Use read replicas for read-heavy workloads
- **Load Balancer**: Use nginx or cloud load balancer
- **CDN**: Serve static assets from CDN

## 📁 Project Structure

```
PwrProgram/
├── apps/
│   └── pwrprogram/              # Main API application
│       ├── src/
│       │   ├── entity/          # TypeORM entities
│       │   ├── routes/          # Express route handlers
│       │   ├── middleware/      # Custom middleware
│       │   ├── mappers/         # Entity to DTO mappers
│       │   ├── utils/           # Utility functions
│       │   ├── openapi/         # OpenAPI spec
│       │   ├── testing/         # Test files
│       │   ├── data-source.ts   # TypeORM configuration
│       │   └── index.ts         # Application entry point
│       ├── .env                 # Environment variables (gitignored)
│       └── package.json
├── packages/
│   └── shared/                  # Shared DTOs and types
│       ├── src/
│       │   ├── *.dto.ts         # Data Transfer Objects
│       │   └── index.ts
│       └── package.json
├── .env.example                 # Environment template
├── .gitignore
├── pnpm-workspace.yaml          # PNPM workspace config
└── README.md
```

## 🔑 Key Implementation Details

### Password Security
- Passwords hashed with bcrypt (configurable rounds)
- Never returned in API responses (select: false)
- Minimum 8 characters required
- Current password required for password changes

### Session Management
- Database-backed sessions (scalable to Redis)
- Automatic cleanup of expired sessions
- HttpOnly, Secure, SameSite cookies
- 7-day expiration (configurable)

### Error Handling
- Structured error responses
- Production-safe messages (no stack traces in prod)
- Proper HTTP status codes
- Detailed logging for debugging

### Soft Deletes
- All entities support soft delete
- Deleted data retained in database with `deletedAt` timestamp
- Cascade soft deletes through relationships
- Can be restored if needed

## 🛣️ Roadmap

### Implemented ✅
- User authentication and authorization
- Password hashing and security
- Session management
- CRUD operations for all resources
- Soft deletes
- Pagination
- Database indexes
- Error handling
- Logging
- API documentation
- Security headers
- Rate limiting
- CORS

### Planned 🎯
- [ ] Email verification
- [ ] Password reset via email
- [ ] Role-based access control (RBAC)
- [ ] Coach/athlete relationships
- [ ] Workout logging and tracking
- [ ] Progress analytics and charts
- [ ] File uploads (exercise videos/images)
- [ ] Search and filtering
- [ ] Database migrations
- [ ] GraphQL API (optional)
- [ ] Real-time updates (WebSockets)
- [ ] Mobile app integration
- [ ] Social features (sharing, comments)
- [ ] Nutrition tracking
- [ ] Calendar integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow existing code style (ESLint/Prettier)
- Update documentation
- Use conventional commits
- Keep PRs focused and small

## 📝 License

[Your License Here]

## 💬 Support

- **Issues**: GitHub Issues
- **Email**: [Your Email]
- **Documentation**: `/docs` endpoint

## 🙏 Acknowledgments

- Built with [TypeORM](https://typeorm.io/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Note**: This is a backend API. Frontend coming soon!
