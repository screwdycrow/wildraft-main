import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function importDatabase() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.log('Usage: npm run db:import <backup_file.sql>');
    console.log('Example: npm run db:import wildraft_backup.sql');
    process.exit(1);
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`Error: File '${backupFile}' not found`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  try {
    const url = new URL(databaseUrl);
    const user = url.username || 'wildraft';
    const password = url.password || '';
    const host = url.hostname || 'localhost';
    const port = url.port || '5432';
    const database = url.pathname.slice(1) || 'wildraft';

    console.log('\n⚠️  WARNING: This will overwrite your current database!');
    console.log(`  Database: ${database}`);
    console.log(`  Host: ${host}`);
    console.log(`  Backup: ${backupFile}`);

    const answer = await question('\nContinue? (type "yes" to confirm): ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled');
      rl.close();
      process.exit(0);
    }

    console.log('\nStarting import process...');

    // Drop existing database
    console.log('  1/4 Dropping existing database...');
    try {
      await execAsync(
        `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -tc "DROP DATABASE IF EXISTS ${database};" 2>/dev/null || true`
      );
    } catch {
      // Ignore errors - database might not exist
    }

    // Create fresh database
    console.log('  2/4 Creating fresh database...');
    await execAsync(
      `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -tc "CREATE DATABASE ${database};"`
    );

    // Import data from backup
    console.log('  3/4 Importing data from backup...');
    const sqlContent = fs.readFileSync(backupFile, 'utf-8');
    await execAsync(
      `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database}`,
      { input: sqlContent, maxBuffer: 10 * 1024 * 1024 }
    );

    // Run migrations
    console.log('  4/4 Running migrations...');
    await execAsync('npx prisma migrate deploy --skip-generate');

    console.log('\n✓ Database import complete!');
    console.log(`  Successfully imported from ${path.basename(backupFile)}`);

    rl.close();
  } catch (err) {
    console.error(
      '\n✗ Import failed:',
      err instanceof Error ? err.message : String(err)
    );
    rl.close();
    process.exit(1);
  }
}

importDatabase();
