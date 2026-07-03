import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function exportDatabase() {
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

    const timestamp = new Date()
      .toISOString()
      .replace(/[:-]/g, '')
      .replace(/\..+/, '')
      .slice(0, 15);
    const backupFile = path.join(
      process.cwd(),
      `wildraft_backup_${timestamp}.sql`
    );

    console.log('Creating database backup...');

    const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database}`;

    const { stdout } = await execAsync(cmd);
    fs.writeFileSync(backupFile, stdout);

    const size = fs.statSync(backupFile).size;
    const sizeMB = (size / 1024 / 1024).toFixed(2);

    console.log(`✓ Database exported successfully!`);
    console.log(`  File: ${backupFile}`);
    console.log(`  Size: ${sizeMB}MB`);
  } catch (err) {
    console.error('Export failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

exportDatabase();
