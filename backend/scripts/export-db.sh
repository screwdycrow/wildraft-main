#!/bin/bash
# Export database backup

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

BACKUP_FILE="${1:-wildraft_backup_$(date +%Y%m%d_%H%M%S).sql}"

echo "Exporting database to $BACKUP_FILE..."

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database?schema=public
NODE_OPTIONS="" npx tsx << 'EOF'
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);
const databaseUrl = process.env.DATABASE_URL || '';

// Parse connection string
const url = new URL(databaseUrl);
const user = url.username || 'wildraft';
const password = url.password || '';
const host = url.hostname || 'localhost';
const port = url.port || '5432';
const database = url.pathname.slice(1) || 'wildraft';

const backupFile = process.argv[2] || `wildraft_backup_${new Date().toISOString().split('T')[0]}.sql`;

const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} > ${backupFile}`;

console.log('Creating backup...');
execAsync(cmd).then(() => {
  const size = fs.statSync(backupFile).size;
  console.log(`✓ Database exported successfully to ${backupFile} (${(size / 1024 / 1024).toFixed(2)}MB)`);
}).catch(err => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
EOF
