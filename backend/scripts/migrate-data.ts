/**
 * One-time data migration: copies all rows from a SOURCE database to a
 * DEST database using Prisma Client (no pg_dump / Docker needed).
 *
 * Both databases must already have the schema (run `prisma migrate deploy`
 * on the destination first — Railway does this automatically on deploy).
 *
 * Usage (PowerShell):
 *   $env:SOURCE_DATABASE_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
 *   $env:DEST_DATABASE_URL="postgresql://...railway public url..."
 *   npx tsx scripts/migrate-data.ts
 *
 * Usage (bash):
 *   SOURCE_DATABASE_URL="..." DEST_DATABASE_URL="..." npx tsx scripts/migrate-data.ts
 */
import { PrismaClient } from '@prisma/client';

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const DEST_URL = process.env.DEST_DATABASE_URL;

if (!SOURCE_URL || !DEST_URL) {
  console.error('Error: set SOURCE_DATABASE_URL and DEST_DATABASE_URL env vars.');
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } });
const dest = new PrismaClient({ datasources: { db: { url: DEST_URL } } });

// Models in foreign-key-safe order (parents before children). The property
// name is the Prisma Client accessor; the table name is used for sequence resets.
const MODELS: { key: keyof PrismaClient; table: string; hasIntId: boolean }[] = [
  { key: 'user', table: 'User', hasIntId: true },
  { key: 'library', table: 'Library', hasIntId: true },
  { key: 'libraryAccess', table: 'LibraryAccess', hasIntId: true },
  { key: 'userFileCategory', table: 'UserFileCategory', hasIntId: true },
  { key: 'userFile', table: 'UserFile', hasIntId: true },
  { key: 'tagFolder', table: 'TagFolder', hasIntId: true },
  { key: 'libraryItem', table: 'LibraryItem', hasIntId: true },
  { key: 'tag', table: 'Tag', hasIntId: true },
  { key: 'combatEncounter', table: 'CombatEncounter', hasIntId: true },
  { key: 'dMScreen', table: 'DMScreen', hasIntId: false },
  { key: 'portalView', table: 'PortalView', hasIntId: false },
  { key: 'libraryVersion', table: 'LibraryVersion', hasIntId: true },
  { key: 'aiConversation', table: 'AiConversation', hasIntId: false },
  { key: 'aiMessage', table: 'AiMessage', hasIntId: false },
];

const CHUNK = 500;

async function main() {
  console.log('Connecting...');
  await source.$connect();
  await dest.$connect();
  console.log('Connected to both databases.\n');

  // 1) Copy each model's rows, preserving primary keys.
  for (const { key, table } of MODELS) {
    const model = source[key] as any;
    const rows: any[] = await model.findMany();
    if (rows.length === 0) {
      console.log(`- ${table}: 0 rows (skip)`);
      continue;
    }
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = rows.slice(i, i + CHUNK);
      const res = await (dest[key] as any).createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += res.count;
    }
    console.log(`- ${table}: ${inserted}/${rows.length} rows copied`);
  }

  // 2) Copy implicit many-to-many join tables (names start with "_").
  const joinTables: { table_name: string }[] = await source.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE '\\_%'
       AND table_name <> '_prisma_migrations'`
  );
  for (const { table_name } of joinTables) {
    const pairs: { A: any; B: any }[] = await source.$queryRawUnsafe(
      `SELECT "A", "B" FROM "${table_name}"`
    );
    let inserted = 0;
    for (const { A, B } of pairs) {
      try {
        await dest.$executeRawUnsafe(
          `INSERT INTO "${table_name}" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          A,
          B
        );
        inserted++;
      } catch (e) {
        // ignore individual conflicts
      }
    }
    console.log(`- ${table_name} (join): ${inserted}/${pairs.length} rows copied`);
  }

  // 3) Reset autoincrement sequences on the destination so new inserts don't
  //    collide with the copied primary keys.
  console.log('\nResetting id sequences...');
  for (const { table, hasIntId } of MODELS) {
    if (!hasIntId) continue;
    await dest.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'),
         (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`
    );
  }

  console.log('\n✓ Data migration complete!');
}

main()
  .catch((e) => {
    console.error('\n✗ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await dest.$disconnect();
  });
