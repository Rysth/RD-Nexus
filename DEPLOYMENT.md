# Deployment Guide - Multi-Company Setup

This guide explains how to deploy the same codebase for different companies (e.g., current setup for "currentcompany.com" and new deployment for "newcompany.com").

## 🚀 6-Step Deployment Process

### Step 1: Update Docker Network Name
**File:** `docker-compose.yml`

Change the network name to avoid conflicts:
```yaml
networks:
  newcompany_network:  # Change from app_name_network
    driver: bridge
```

And update all service network references:
```yaml
services:
  client:
    networks:
      - newcompany_network  # Update this
  backend:
    networks:
      - newcompany_network  # Update this
  jobs:
    networks:
      - newcompany_network  # Update this
```

### Step 2: Update Domain Names in Docker Compose
**File:** `docker-compose.yml`

Update Traefik labels with new domains:
```yaml
services:
  client:
    labels:
      - "traefik.http.routers.client.rule=Host(`newcompany.com`)"  # New domain
  backend:
    labels:
      - "traefik.http.routers.backend.rule=Host(`api.newcompany.com`)"  # New API domain
```

### Step 3: Update Nginx Configuration
**File:** `client/nginx.conf`

Change the upstream server, server_name, and Host header (3 places):
```nginx
# Upstream for AdonisJS API using external domain
upstream adonis_backend {
    server api.newcompany.com:443;  # New API domain
}

server {
    listen 5173;
    server_name newcompany.com;  # New client domain
    root /usr/share/nginx/html;
    index index.html;

    resolver 1.1.1.1 8.8.8.8 valid=30s;

    location /api/ {
        proxy_pass https://adonis_backend;
        proxy_set_header Host api.newcompany.com;  # New API domain
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 4: Update Vite Configuration
**File:** `client/vite.config.ts`

Update the allowed hosts for Vite dev server:
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['newcompany.com']  // New domain
  },
  preview: {
    host: true,
    port: 5173
  }
})
```

### Step 5: Update Environment Variables
**File:** `.env` (create for new deployment)

Set up environment variables for the new company:
```env
# Frontend
FRONTEND_URL=https://newcompany.com
VITE_API_URL=https://api.newcompany.com

# AdonisJS
ADONIS_APP_KEY=your_generated_key  # Generate with: node ace generate:key
APP_URL=https://api.newcompany.com

# Database (new database for new company)
DB_HOST=your_db_host
DB_PORT=5432
DB_DATABASE=newcompany_db
DB_USER=newcompany_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# SMTP
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

### Step 6: Deploy and Create Admin
```bash
# Build and deploy
docker compose build
docker compose up -d

# Run migrations
docker compose exec backend node ace migration:run

# Create admin account (run seeder)
docker compose exec backend node ace db:seed --files database/seeders/admin_seeder.ts
```

## 🔄 Database Migrations

### Automatic Migration Execution
For production deployments, you can configure the backend Dockerfile to run migrations on startup by modifying the entrypoint:

```dockerfile
# In backend/Dockerfile
CMD ["sh", "-c", "node ace migration:run --force && node bin/server.js"]
```

### Migration Process
1. **Add new migration:** `node ace make:migration add_new_feature`
2. **Commit changes:** Push to your repository
3. **Deploy:** Run `docker compose up -d backend`
4. **Automatic execution:** Server restarts and runs migrations automatically

### Manual Migration (if needed)
```bash
# Run all pending migrations
docker compose exec backend node ace migration:run

# Rollback last migration
docker compose exec backend node ace migration:rollback

# Check migration status
docker compose exec backend node ace migration:status

# Fresh migration (drop all tables and re-run migrations)
docker compose exec backend node ace migration:fresh

# Fresh migration with seeders
docker compose exec backend node ace migration:fresh --seed
```

## 📋 Quick Checklist for New Deployment

- [ ] Change network name in `docker-compose.yml`
- [ ] Update client domain in Traefik labels
- [ ] Update backend domain in Traefik labels
- [ ] Update domains in `client/nginx.conf` (3 places: upstream server, server_name, and proxy_set_header Host)
- [ ] Update allowed hosts in `client/vite.config.ts`
- [ ] Create new `.env` file with company-specific variables
- [ ] Generate new `ADONIS_APP_KEY` with `node ace generate:key`
- [ ] Build and deploy: `docker compose up -d`
- [ ] Run migrations: `docker compose exec backend node ace migration:run`
- [ ] Create admin account with seeder
- [ ] Test login and functionality

## 🔍 Troubleshooting

### Common Issues
1. **502 Bad Gateway:** Check nginx upstream domain matches Traefik labels
2. **SSL Errors:** Ensure using port 443 in nginx upstream
3. **Migration Errors:** Check database connection and permissions
4. **Network Issues:** Verify all services use the same network name
5. **Redis Connection:** Verify REDIS_HOST and REDIS_PASSWORD are correct

### Debug Commands
```bash
# Check running containers
docker ps

# View backend logs
docker compose logs -f backend

# View client logs
docker compose logs -f client

# View jobs worker logs
docker compose logs -f jobs

# Check network connectivity
docker network inspect newcompany_network

# AdonisJS REPL (interactive console)
docker compose exec backend node ace repl

# List all ace commands
docker compose exec backend node ace list

# Check routes
docker compose exec backend node ace list:routes
```

### Redis Commands
```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Flush all cache
docker compose exec redis redis-cli FLUSHALL

# Check stored keys
docker compose exec redis redis-cli KEYS "*"
```

## 📝 Notes

- **Database:** Each deployment should use a separate database
- **Admin Account:** Use the admin seeder or create manually via REPL
- **Environment:** Use different `.env` files for each deployment
- **Domains:** Ensure DNS points to your server (Dokploy, VPS, etc.)
- **SSL:** Traefik automatically handles Let's Encrypt certificates for new domains
- **Jobs:** Background jobs are processed by the `jobs` service using Redis queues

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Traefik   │────▶│   Backend   │
│  (React)    │     │  (Reverse   │     │ (AdonisJS)  │
│  Port 5173  │     │   Proxy)    │     │  Port 3333  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐              ┌─────▼─────┐              ┌─────▼─────┐
              │  Postgres │              │   Redis   │              │   Jobs    │
              │  (DB)     │              │  (Cache)  │              │  Worker   │
              │  Port 5432│              │  Port 6379│              │           │
              └───────────┘              └───────────┘              └───────────┘
```

---

**Created by:** [RysthDesign](https://rysthdesign.com/)