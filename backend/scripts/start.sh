#!/bin/sh
# Application startup script

set -e

echo "Starting Wildraft Backend..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set"
  exit 1
fi

# Wait for database to be ready with timeout
echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if echo "SELECT 1;" | npx prisma db execute --schema prisma/schema.prisma --stdin >/dev/null 2>&1; then
    echo "✓ Database is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES - retrying in 1 second..."
    sleep 1
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Could not connect to database after $MAX_RETRIES attempts"
  exit 1
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy --skip-generate

# Start the application
echo "✓ Database ready, starting application..."
node dist/index.js
