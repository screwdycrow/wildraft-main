# Database Setup Guide

This guide covers database initialization, migration, import/export, and deployment to Railway.

## Local Development with Docker Compose

### Quick Start

```bash
# 1. Install dependencies
npm install
cd backend && npm install

# 2. Start services (includes PostgreSQL with auto-initialization)
docker-compose up -d

# 3. Check if migrations ran automatically
docker-compose logs backend

# 4. Access the app
# Frontend: http://localhost
# Backend API: http://localhost:3000
# Database: localhost:5432 (wildraft/wildraft_secret)
```

The database automatically:
- Creates the `wildraft` database on first run
- Runs all pending Prisma migrations on backend startup
- Persists data in the `postgres_data` volume

### Database Commands

#### View database with Prisma Studio
```bash
cd backend
npm run prisma:studio
```

#### Create a new migration (after schema changes)
```bash
cd backend
npm run prisma:migrate
```

#### Check migration status
```bash
docker-compose exec backend npx prisma migrate status
```

## Database Export & Import

### Export Database to Backup File

```bash
cd backend
npm run db:export
# Creates: wildraft_backup_YYYYMMDD_HHMMSS.sql
```

Or specify a custom filename:
```bash
npm run db:export /path/to/mybackup.sql
```

### Import Database from Backup

```bash
cd backend
# Will prompt for confirmation before overwriting
npm run db:import wildraft_backup.sql
```

**Important:** Import process:
1. Drops the existing database
2. Creates a fresh database
3. Restores data from backup
4. Runs all Prisma migrations to ensure schema is up-to-date

## Deployment to Railway

### Step 1: Set Up Railway PostgreSQL Plugin

1. In your Railway project dashboard
2. Add a new PostgreSQL service from the plugins
3. Note the connection string (auto-populated in `DATABASE_URL` variable)

### Step 2: Configure Environment Variables

In Railway dashboard, set:
```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

**Note:** The `DATABASE_URL` from the PostgreSQL plugin is automatically available to your service.

### Step 3: Deploy

1. Connect your Git repository to Railway
2. Choose the branch to deploy
3. Railway will automatically:
   - Build the Docker image using the `Dockerfile`
   - Run `npm ci` to install dependencies
   - Run the `start.sh` script which:
     - Waits for database readiness
     - Runs pending migrations
     - Starts the application

### Step 4: Verify Deployment

```bash
# Check logs
railway logs -d backend

# Verify database is working
railway exec -d postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT version();"
```

## Importing Data to Railway

### Option 1: From Local Backup via Railway CLI

```bash
# Export from local database
cd backend
npm run db:export my_data.sql

# Connect to Railway database and import
railway connect postgres
# Then from psql:
# \i /path/to/my_data.sql

# Or via command line:
PGPASSWORD=$RAILWAY_DB_PASSWORD psql -h $RAILWAY_HOST -U $RAILWAY_USER -d $RAILWAY_DB < my_data.sql
```

### Option 2: Using Railway Dashboard

1. Go to your Railway project → PostgreSQL plugin
2. Use the built-in tools or connect your database client (pgAdmin, DBeaver, etc.)
3. Import the SQL dump

## Troubleshooting

### "Error: could not connect to database"

**Docker Compose:**
- Check PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Ensure port 5432 is available: `netstat -tulpn | grep 5432`

**Railway:**
- Verify `DATABASE_URL` is set in environment variables
- Check service logs for connection errors
- Ensure database is ready: `railway logs -d postgres`

### "Migration failed"

```bash
# View migration status
cd backend
npx prisma migrate status

# Resolve pending migrations
npx prisma migrate deploy --skip-generate

# If stuck, reset to base (dev only!)
npx prisma migrate reset  # Drops and recreates database
```

### "Database already exists"

The setup handles this automatically. If you need to reset:

```bash
# Docker Compose
docker-compose down -v  # -v removes volumes
docker-compose up

# Railway
# Cannot directly reset; contact Railway support or delete and recreate the PostgreSQL plugin
```

## Best Practices

1. **Always backup before importing**: `npm run db:export backup_$(date +%s).sql`
2. **Test migrations locally first**: Make changes, run `npm run prisma:migrate`, test thoroughly
3. **Keep migrations clean**: Use descriptive names, avoid multiple schema changes in one migration
4. **Monitor Railway logs**: Set up alerts for migration failures
5. **Version control schema**: The `prisma/schema.prisma` file is your source of truth

## Development Workflow

```bash
# 1. Update Prisma schema (backend/prisma/schema.prisma)
# 2. Create migration
cd backend && npm run prisma:migrate

# 3. Test locally
npm run dev

# 4. Commit migration files with your changes
git add backend/prisma/migrations/
git commit -m "feat: Add new database tables"

# 5. Push to Railway
git push origin main
# Railway automatically runs migrations during deployment
```
