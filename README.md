# Wildraft Prisma Backend

A backend service built with Prisma, PostgreSQL, Fastify, and TypeScript.

## 🚀 Tech Stack

- **Framework**: [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation TypeScript ORM
- **Database**: PostgreSQL
- **Language**: TypeScript

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

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wildraft_db?schema=public"

# Server
PORT=3000
HOST=0.0.0.0

# Environment
NODE_ENV=development
```

**Note**: Replace the `DATABASE_URL` with your actual PostgreSQL connection string.

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

## 🗂️ Project Structure

```
wildraft-prisma-backend/
├── prisma/
│   └── schema.prisma          # Prisma schema file
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prisma client initialization
│   ├── routes/
│   │   ├── index.ts           # Route registration
│   │   ├── health.ts          # Health check endpoints
│   │   └── users.ts           # User CRUD endpoints (example)
│   └── index.ts               # Application entry point
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Health Check

- `GET /health` - Basic health check
- `GET /health/db` - Database connection health check

### Users (Example CRUD)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe"
  }
  ```
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

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

