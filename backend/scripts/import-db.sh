#!/bin/bash
# Import database from backup file

if [ -z "$1" ]; then
  echo "Usage: npm run import-db <backup_file.sql>"
  echo "Example: npm run import-db wildraft_backup.sql"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "Error: File '$1' not found"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

echo "Importing database from $1..."
echo "WARNING: This will overwrite the current database!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled"
  exit 1
fi

NODE_OPTIONS="" npx tsx << EOF
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const databaseUrl = process.env.DATABASE_URL || '';
const backupFile = '$1';

// Parse connection string
const url = new URL(databaseUrl);
const user = url.username || 'wildraft';
const password = url.password || '';
const host = url.hostname || 'localhost';
const port = url.port || '5432';
const database = url.pathname.slice(1) || 'wildraft';

// Drop existing database and recreate it
const dropCmd = \`PGPASSWORD="\${password}" psql -h \${host} -p \${port} -U \${user} -tc "DROP DATABASE IF EXISTS \${database};"\`;
const createCmd = \`PGPASSWORD="\${password}" psql -h \${host} -p \${port} -U \${user} -tc "CREATE DATABASE \${database};"\`;
const restoreCmd = \`PGPASSWORD="\${password}" psql -h \${host} -p \${port} -U \${user} -d \${database} < \${backupFile}\`;

console.log('Preparing database for import...');

(async () => {
  try {
    console.log('Dropping existing database...');
    await execAsync(dropCmd);

    console.log('Creating fresh database...');
    await execAsync(createCmd);

    console.log('Importing data from backup...');
    await execAsync(restoreCmd);

    console.log('✓ Database import complete!');
    console.log('Running migrations to ensure schema is up-to-date...');
    await execAsync('npx prisma migrate deploy --skip-generate');

    console.log('✓ All done!');
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
})();
EOF
