#!/bin/bash
# Initialize database - runs migrations and seeds

set -e

echo "Waiting for database to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready!"
echo "Running Prisma migrations..."
npx prisma migrate deploy --skip-generate

echo "Database initialization complete!"
