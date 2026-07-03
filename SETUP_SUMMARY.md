# Database Setup - What Was Done

Your Wildraft project now has complete database auto-initialization and import/export capabilities for both Docker Compose and Railway deployment.

## Files Added/Modified

### New Files Created:
1. **`backend/scripts/start.sh`** - Entry point for Docker container
   - Waits for database readiness
   - Runs Prisma migrations
   - Starts the application

2. **`backend/scripts/export-db.ts`** - Database export utility
   - Creates SQL backup files
   - Usage: `npm run db:export [filename]`

3. **`backend/scripts/import-db.ts`** - Database import utility
   - Restores from backup with confirmation prompt
   - Runs migrations after import
   - Usage: `npm run db:import backup.sql`

4. **`scripts/init-postgres.sql`** - PostgreSQL initialization script
   - Auto-runs when PostgreSQL container starts
   - Ensures database and permissions are set up

5. **`DATABASE_SETUP.md`** - Comprehensive database guide
   - Local development instructions
   - Import/export procedures
   - Railway deployment guide

6. **`RAILWAY_DEPLOYMENT.md`** - Railway-specific deployment guide
   - Step-by-step setup instructions
   - Database management on Railway
   - Troubleshooting and monitoring

### Modified Files:
1. **`docker-compose.yml`**
   - Added `init-postgres.sql` volume mount
   - Added `POSTGRES_INITDB_ARGS` for UTF8 encoding
   - Database automatically initializes on first run

2. **`backend/Dockerfile`**
   - Changed entrypoint to use `start.sh`
   - Copies startup script into image
   - Makes script executable

3. **`.env.example`**
   - Updated with all configuration options
   - Added DATABASE_URL format for Railway
   - Documented optional AWS S3 and OpenAI settings

4. **`backend/package.json`**
   - Added `db:export` script (TypeScript-based)
   - Added `db:import` script (TypeScript-based)
   - Works cross-platform (Windows, Mac, Linux)

## How It Works

### Local Development (Docker Compose)

```bash
docker-compose up
```

**Automatic process:**
1. PostgreSQL container starts
2. `init-postgres.sql` creates the `wildraft` database
3. Backend container waits for database readiness
4. `start.sh` runs Prisma migrations
5. Application starts on port 3000

### Database Operations

```bash
# Export database
cd backend
npm run db:export

# Import database
npm run db:import backup.sql

# Prisma Studio (visual editor)
npm run prisma:studio
```

### Railway Deployment

```bash
git push origin main
```

**Automatic process:**
1. Railway detects push
2. Builds Docker image
3. Deploys to Railway
4. Database readiness check runs
5. Migrations applied automatically
6. Application starts

## Environment Variables

**Required for production (Railway):**
- `DATABASE_URL` - Auto-set by Railway PostgreSQL plugin
- `NODE_ENV=production`
- `PORT=3000`
- `HOST=0.0.0.0`

**Optional:**
- AWS S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_ENDPOINT`
- OpenAI: `OPENAI_API_KEY`

See `.env.example` for all options.

## Key Features

✅ **Auto-initialization** - Database creates itself if missing  
✅ **Automatic migrations** - Runs on every deployment  
✅ **Cross-platform** - Works on Windows, Mac, Linux  
✅ **Import/Export** - Easy backup and restoration  
✅ **Docker Compose ready** - Local dev just works  
✅ **Railway ready** - Production deployment is seamless  
✅ **Health checks** - Container waits for database before starting  

## Testing Locally

```bash
# Clean start
docker-compose down -v
docker-compose up

# Check logs
docker-compose logs -f backend

# Access database
psql postgresql://wildraft:wildraft_secret@localhost:5432/wildraft

# View in UI (with password: wildraft_secret)
npm run prisma:studio
```

## Deployment to Railway

1. Connect GitHub repo to Railway
2. Add PostgreSQL plugin (auto-creates `DATABASE_URL`)
3. Deploy (migrations run automatically)
4. Done! ✓

## What to Do Next

1. **Test locally**: `docker-compose up` and verify it works
2. **Push to Railway**: Connect repo and deploy
3. **Import data** (if needed): `npm run db:import existing_backup.sql`
4. **Monitor**: Check Railway logs for any issues

## Troubleshooting

See `DATABASE_SETUP.md` and `RAILWAY_DEPLOYMENT.md` for:
- Connection issues
- Migration problems
- Database reset procedures
- Performance tuning

## Documentation

- **`DATABASE_SETUP.md`** - Local dev, export/import, Railway guide
- **`RAILWAY_DEPLOYMENT.md`** - Production deployment details
- **`.env.example`** - All environment variables

---

**Everything is ready to go!** Your database will now auto-initialize and you can easily deploy to Railway without manual database setup.
