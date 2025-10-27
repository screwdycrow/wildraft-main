# Wildraft Prisma Backend

A backend service built with Prisma, PostgreSQL, Fastify, and TypeScript.

## 🚀 Tech Stack

- **Framework**: [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation TypeScript ORM
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Authentication**: Email/Password + Google OAuth 2.0 + JWT

## 📚 Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[QUICKSTART.md](./QUICKSTART.md)** | 5-minute setup | Start here! |
| **[SWAGGER.md](./SWAGGER.md)** | API docs & testing | Testing endpoints |
| **[AUTHENTICATION.md](./AUTHENTICATION.md)** | Auth system details | Implementing auth |
| **[LIBRARIES.md](./LIBRARIES.md)** | Library & access control | Using library features |
| **[ENV_SETUP.md](./ENV_SETUP.md)** | Environment config | Setting up .env |
| **[docs/SCHEMA_ORGANIZATION.md](./docs/SCHEMA_ORGANIZATION.md)** | Schema structure | Adding new routes |

## ⚡ Quick Start

```bash
npm install
npx prisma db push
npm run dev
```

See [QUICKSTART.md](./QUICKSTART.md) for details.

## 📖 API Documentation

Interactive Swagger UI: **http://localhost:3000/docs**

Export for Postman: `npm run docs:export`

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database
- npm or yarn

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory. See `ENV_SETUP.md` for complete configuration including Google OAuth setup.

**Minimum configuration:**

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wildraft_db?schema=public"

# Server
PORT=3000
HOST=0.0.0.0

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Google OAuth (required for authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Note**: Replace the values with your actual credentials. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

### 3. Set Up Prisma

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port you specified in `.env`).

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run docs:export` - Export OpenAPI spec for Postman

## 🗂️ Project Structure

```
wildraft-prisma-backend/
├── prisma/
│   └── schema.prisma               # Prisma schema (User, Library, LibraryAccess models)
├── src/
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client initialization
│   │   ├── jwt.ts                  # JWT token utilities
│   │   ├── password.ts             # Password hashing utilities
│   │   └── library-permissions.ts # Library permission helpers
│   ├── middleware/
│   │   ├── auth.ts                 # Authentication middleware
│   │   └── library-access.ts      # Library access control middleware
│   ├── schemas/
│   │   ├── common.schemas.ts       # Reusable schema components
│   │   ├── auth.schemas.ts         # Auth route schemas (for Swagger)
│   │   ├── user.schemas.ts         # User profile schemas
│   │   ├── library.schemas.ts      # Library route schemas
│   │   └── library-access.schemas.ts # Library access schemas
│   ├── routes/
│   │   ├── index.ts                # Route registration
│   │   ├── health.ts               # Health check endpoints
│   │   ├── auth.ts                 # Authentication routes (OAuth, JWT)
│   │   ├── users.ts                # User profile management
│   │   ├── libraries.ts            # Library CRUD with permissions
│   │   └── library-access.ts      # Library access management
│   └── index.ts                    # Application entry point
├── docs/
│   └── SCHEMA_ORGANIZATION.md      # Schema organization guide
├── AUTHENTICATION.md               # Authentication guide
├── LIBRARIES.md                    # Library system guide
├── SWAGGER.md                      # API documentation guide
├── ENV_SETUP.md                    # Environment setup
├── QUICKSTART.md                   # Quick start (5 min setup)
└── README.md                       # This file
```

## 🔌 API Endpoints

### Health Check

- `GET /health` - Basic health check
- `GET /health/db` - Database connection health check

### Authentication

**Email/Password:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password

**Google OAuth:**
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - OAuth callback endpoint

**Common:**
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

**📖 See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication documentation**

### Libraries (Role-Based Access Control)

**Library Management:**
- `GET /api/libraries` - Get all accessible libraries with roles
- `GET /api/libraries/:id` - Get library details
- `POST /api/libraries` - Create new library
- `PUT /api/libraries/:id` - Update library (EDITOR+)
- `DELETE /api/libraries/:id` - Delete library (OWNER only)

**Access Management:**
- `GET /api/libraries/:id/access` - Get access list
- `POST /api/libraries/:id/access` - Grant access to user
- `PUT /api/libraries/:id/access/:accessId` - Update access level
- `DELETE /api/libraries/:id/access/:accessId` - Remove access
- `POST /api/libraries/:id/leave` - Leave library

**Access Roles:** OWNER (full control), EDITOR (edit + manage viewers), VIEWER (read-only)

**📖 See [LIBRARIES.md](./LIBRARIES.md) for complete library system documentation**

### User Profile

- `PUT /api/users/me` - Update current user profile (name, email)
- `PUT /api/users/me/password` - Change password

## 🗄️ Database Schema

The project includes an example `User` model in `prisma/schema.prisma`. You can modify or extend this schema according to your needs.

After making changes to the schema:
1. Run `npm run prisma:migrate` to create and apply migrations
2. Run `npm run prisma:generate` to update the Prisma Client

## 🔧 Development

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Register it in `src/routes/index.ts`

Example:
```typescript
import { FastifyInstance } from 'fastify';

export const myRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/', async (request, reply) => {
    return { message: 'Hello World' };
  });
};
```

### Using Prisma

Import the Prisma client from `src/lib/prisma.ts`:

```typescript
import { prisma } from '../lib/prisma';

// Example query
const users = await prisma.user.findMany();
```

## 🚀 Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables for production

3. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Start the server:
   ```bash
   npm start
   ```

## 📚 Resources

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

ISC

