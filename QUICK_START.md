# Quick Start Guide - PwrProgram API

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Node.js 18+
- PNPM 8+
- PostgreSQL 14+ (or Docker)

---

## Step 1: Install Dependencies

```bash
pnpm install
```

---

## Step 2: Set Up Database

### Option A: Using Docker (Recommended)
```bash
docker run --name pwrprogram-postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14
```

### Option B: Using Local PostgreSQL
```bash
createdb pwrprogram
```

---

## Step 3: Configure Environment

The `.env` file is already created in `apps/pwrprogram/.env` with development defaults.

**Optional**: Edit if you need to change any settings:
```bash
# apps/pwrprogram/.env
DB_PASSWORD=your_password
SESSION_SECRET=your_very_long_secret_key_here
```

---

## Step 4: Start the Server

```bash
pnpm --filter @pwrprogram/api dev
```

You should see:
```
Server running on port 3000
API Documentation available at http://localhost:3000/docs
Environment: development
```

---

## Step 5: Test the API

### View API Documentation
Open your browser: http://localhost:3000/docs

### Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "securepass123",
    "firstName": "Demo",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "demo@example.com",
    "password": "securepass123"
  }'
```

### Access Your Profile
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### Create a Program
```bash
curl -X POST http://localhost:3000/api/programs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "My First Program",
    "description": "A comprehensive training program"
  }'
```

### List Your Programs
```bash
curl http://localhost:3000/api/programs \
  -b cookies.txt
```

---

## 🎯 You're All Set!

### What's Next?

1. **Explore the API**: Visit http://localhost:3000/docs
2. **Read the Docs**: See [README.md](README.md) for complete documentation
3. **Review Changes**: Check [CHANGES.md](CHANGES.md) for all improvements
4. **Build Your Frontend**: All endpoints are ready to use

### API Endpoints Overview

#### Authentication (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

#### Users (Protected)
- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update profile
- `DELETE /api/users/:id` - Delete account

#### Programs (Protected)
- `GET /api/programs` - List your programs
- `GET /api/programs/:id` - Get program
- `POST /api/programs` - Create program
- `DELETE /api/programs/:id` - Delete program

#### More Resources
- Cycles, Blocks, Sessions, Exercises, Sets
- Full CRUD operations available
- See Swagger docs for details

---

## 💡 Tips

### Development Workflow
```bash
# Start dev server with hot reload
pnpm --filter @pwrprogram/api dev

# Run tests
pnpm --filter @pwrprogram/api test

# Check TypeScript
pnpm --filter @pwrprogram/api typecheck

# Lint code
pnpm --filter @pwrprogram/api lint

# Format code
pnpm --filter @pwrprogram/api format
```

### Using with Frontend

Save the session cookie and send it with each request:

**JavaScript/Fetch:**
```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important!
  body: JSON.stringify({
    email: 'demo@example.com',
    password: 'securepass123'
  })
});

// Subsequent requests
const programsResponse = await fetch('http://localhost:3000/api/programs', {
  credentials: 'include' // Cookie sent automatically
});
```

**Axios:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

// Login
await api.post('/auth/login', {
  email: 'demo@example.com',
  password: 'securepass123'
});

// Get programs
const { data } = await api.get('/programs');
```

### Database Management

```bash
# Connect to database
docker exec -it pwrprogram-postgres psql -U postgres -d pwrprogram

# View tables
\dt

# View users
SELECT id, email, "firstName" FROM "user";

# View programs
SELECT id, name, "userId" FROM program;
```

---

## 🔧 Troubleshooting

### Port 3000 Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps

# Check credentials in .env match your setup
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=pwrprogram
```

### TypeScript Errors
```bash
# Rebuild
pnpm --filter @pwrprogram/api build:clean
```

### Session/Cookie Issues
- Make sure you're using `credentials: 'include'` in fetch
- Check CORS_ORIGIN in .env includes your frontend URL
- Use `-c cookies.txt` and `-b cookies.txt` with curl

---

## 📚 Additional Resources

- **Full Documentation**: [README.md](README.md)
- **All Changes**: [CHANGES.md](CHANGES.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Interactive API Docs**: http://localhost:3000/docs

---

## ✅ Checklist

- [ ] Dependencies installed (`pnpm install`)
- [ ] Database running (Docker or local)
- [ ] Environment configured (`.env` file)
- [ ] Server started (`pnpm --filter @pwrprogram/api dev`)
- [ ] Registered test user
- [ ] Logged in successfully
- [ ] Created a program
- [ ] Viewed API documentation

---

**Happy Coding! 🚀**

If you encounter any issues, check the troubleshooting section above or review the full README.md.
