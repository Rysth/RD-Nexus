#!/bin/bash
set -e

# Create additional databases for development
# PostgreSQL doesn't support IF NOT EXISTS in CREATE DATABASE
# We use a workaround with SELECT
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE adonisjs_api_development'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'adonisjs_api_development')\gexec
EOSQL

echo "Additional databases created successfully"
