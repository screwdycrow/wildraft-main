# Railway Deployment Guide

Complete step-by-step guide to deploy Wildraft to Railway with automatic database setup.

## Prerequisites

- Railway account (https://railway.app)
- Git repository connected to Railway
- This repository with the latest code

## Deployment Steps

### 1. Create Railway Project

```bash
# If you haven't already, log in to Railway
railway login

# Create or link to a project
railway link
```

### 2. Add PostgreSQL Database Plugin

In your Railway project dashboard:

1. Click "Create" → Search for "Postgres"
2. Select "Postgres" and add it
3. Railway will automatically create:
   - A PostgreSQL service
   - Environment variables: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.

### 3. Set Backend Service Environment Variables

The `DATABASE_URL` from PostgreSQL plugin will be automatically available.

In the Backend service settings, verify these are set:
```
DATABASE_URL          (auto-set by PostgreSQL plugin)
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### 4. Connect Your Repository

1. In Railway: Click "Deploy" → "GitHub"
2. Select your repository
3. Choose the branch (e.g., `main`)
4. Railway will automatically:
   - Build the Docker image
   - Run migrations
   - Start the application

### 5. Optional: Set S3 Variables

If you need file uploads, add AWS credentials:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
AWS_ENDPOINT=https://s3.amazonaws.com
```

## Database Management on Railway

### View Database Logs

```bash
railway logs -d postgres
```

### Connect to Database Locally

```bash
# Get connection details from Railway dashboard
# Then use psql or your database client
PGPASSWORD=password psql -h host -U user -d database
```

### Import Data into Railway Database

#### Method 1: Using pgAdmin (GUI)

1. Download pgAdmin (https://www.pgadmin.org/)
2. In pgAdmin, create a new server connection with Railway's database details
3. Use Tools → Restore to import your backup file

#### Method 2: Using psql Command Line

```bash
# Get DATABASE_URL from Railway dashboard
export DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Import backup file
psql $DATABASE_URL < backup_file.sql
```

#### Method 3: Direct Import via Railway CLI

```bash
# Export from local
cd backend
npm run db:export local_backup.sql

# Create a temporary upload location or transfer the file, then:
railway exec -d postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < local_backup.sql
```

## Monitoring & Troubleshooting

### Check Deployment Status

```bash
# View all services
railway status

# View backend logs
railway logs -d backend

# View database logs
railway logs -d postgres
```

### Common Issues

#### ❌ "Connection refused"
- **Cause**: PostgreSQL not ready when backend starts
- **Fix**: The `start.sh` script retries for 30 seconds; check logs: `railway logs -d postgres`

#### ❌ "Migration failed"
- **Cause**: Schema mismatch or database corruption
- **Solution**:
  1. Check logs: `railway logs -d backend`
  2. If needed, manually resolve in Railway dashboard → Postgres service
  3. Redeploy: `railway up`

#### ❌ "Permission denied"
- **Cause**: Insufficient database permissions
- **Fix**: Ensure `POSTGRES_USER` has correct permissions (Railway sets this up automatically)

### Manual Database Reset (Last Resort)

If you need to completely reset the database:

1. In Railway Dashboard → PostgreSQL service
2. Click "Reset" or delete and recreate the plugin
3. Redeploy backend: `railway up`

⚠️ **Warning**: This deletes all data. Always backup first!

## Continuous Deployment

Once connected, every push to your branch automatically:

1. ✓ Builds Docker image
2. ✓ Deploys to Railway
3. ✓ Waits for PostgreSQL readiness
4. ✓ Runs pending migrations
5. ✓ Starts the application

No manual database setup needed after initial connection!

## Backup & Recovery

### Automated Backups

Railway automatically backs up your PostgreSQL database. Access backups in the PostgreSQL service settings.

### Manual Backup

```bash
# Export from Railway database
DATABASE_URL="postgresql://..." npm run db:export backup_$(date +%s).sql

# Store securely (e.g., AWS S3, GitHub Releases, etc.)
```

### Restore from Backup

```bash
# If you have a backup file
npm run db:import backup_file.sql

# This will:
# 1. Drop existing database
# 2. Create fresh database
# 3. Import data from backup
# 4. Run all migrations
```

## Environment Variable Reference

| Variable | Required | Source | Example |
|----------|----------|--------|---------|
| `DATABASE_URL` | ✓ | PostgreSQL plugin | `postgresql://...` |
| `NODE_ENV` | ✓ | Manual | `production` |
| `PORT` | ✓ | Manual | `3000` |
| `HOST` | ✓ | Manual | `0.0.0.0` |
| `AWS_REGION` | | Manual (S3) | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | | Manual (S3) | From AWS |
| `AWS_SECRET_ACCESS_KEY` | | Manual (S3) | From AWS |
| `AWS_S3_BUCKET` | | Manual (S3) | Your bucket name |
| `AWS_ENDPOINT` | | Manual (S3) | `https://s3.amazonaws.com` |

## Performance Tuning

For production Railway deployments:

1. **Upgrade PostgreSQL plan** in Railway dashboard if experiencing slow queries
2. **Use Connection Pooling**: Railway provides this by default
3. **Optimize Prisma client**: Already configured in your code
4. **Monitor metrics**: Railway dashboard shows CPU, memory, database connections

## Support & Documentation

- Railway Docs: https://docs.railway.app
- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs

## Next Steps

After deployment:

1. ✓ Test your API: `https://your-railway-domain/health`
2. ✓ Test database connectivity
3. ✓ Set up monitoring alerts
4. ✓ Configure custom domain (optional)
5. ✓ Enable auto-deploy from main branch
