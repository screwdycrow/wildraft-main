# Quick Start - Database & Deployment

## 🚀 Local Development (30 seconds)

```bash
# Start everything with auto-initialization
docker-compose up

# That's it! The database will:
# - Auto-create if missing
# - Auto-run migrations
# - Auto-start the app on port 3000
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:3000
- Database: localhost:5432 (user: wildraft, pwd: wildraft_secret)

---

## 💾 Database Operations

### Export Backup
```bash
cd backend
npm run db:export
# Creates: wildraft_backup_20251203_143022.sql
```

### Import From Backup
```bash
cd backend
npm run db:import backup.sql
# Confirms before overwriting
```

### View Database (Prisma Studio)
```bash
cd backend
npm run prisma:studio
# Opens http://localhost:5555
```

---

## 🚢 Deploy to Railway (5 minutes)

### Step 1: Connect Repository
```bash
# In Railway Dashboard → GitHub → Select this repo
```

### Step 2: Add PostgreSQL Plugin
```bash
# In Railway Dashboard → Create → Search "Postgres"
# Click Add Postgres
# Railway auto-sets DATABASE_URL
```

### Step 3: Deploy
```bash
git push origin main
# Railway automatically:
# ✓ Builds Docker image
# ✓ Waits for database
# ✓ Runs migrations
# ✓ Starts app
```

**Done!** No manual database setup needed.

---

## 🔧 Environment Variables

### For Railway
```
DATABASE_URL         (auto-set by PostgreSQL plugin)
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### Optional (Copy from .env.example if needed)
```
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_S3_BUCKET=...
OPENAI_API_KEY=...
```

---

## 📋 Key Points

✅ **Database auto-creates** - No manual setup needed  
✅ **Migrations auto-run** - On app startup  
✅ **Cross-platform scripts** - Works on Windows, Mac, Linux  
✅ **Works offline** - Docker Compose is self-contained  
✅ **Zero-config Railway** - Just push to main  

---

## 🐛 Troubleshooting

### "Connection refused"
```bash
# Check if database is ready
docker-compose logs postgres

# Restart services
docker-compose restart
```

### "Migration failed"
```bash
# Check logs
docker-compose logs backend

# Manually reset (dev only!)
docker-compose down -v
docker-compose up
```

### "Can't import database"
```bash
# Verify file exists
ls backup.sql

# Check DATABASE_URL
echo $DATABASE_URL

# Try import with more output
npm run db:import -- --verbose backup.sql
```

---

## 📚 Full Docs

- **`DATABASE_SETUP.md`** - Complete database guide
- **`RAILWAY_DEPLOYMENT.md`** - Production deployment details
- **`.env.example`** - All configuration options

---

## ⚡ One-Liners

```bash
# Local dev
docker-compose up

# Export backup
cd backend && npm run db:export

# Import backup
cd backend && npm run db:import backup.sql

# View database
cd backend && npm run prisma:studio

# Deploy to Railway
git push origin main
```

**That's it!** 🎉
