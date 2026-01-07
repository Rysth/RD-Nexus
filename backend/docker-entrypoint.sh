#!/bin/sh
set -e

echo "🚀 Starting Nexus Backend..."

# Run migrations
echo "📦 Running database migrations..."
node ace migration:run --force

# Run production seeder (only creates if not exists)
echo "🌱 Running production seeder..."
node ace db:seed --files database/seeders/production_seeder.ts

# Start the server
echo "✅ Starting server..."
exec node bin/server.js
