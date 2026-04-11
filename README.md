# # GeoSurePath Track1 - GPS Tracking SaaS Platform

Enterprise-grade GPS tracking server (Traccar-based) + custom SaaS layer with MFA, billing, vehicles, and admin panel.

## Quick Start (Recommended)
```bash
# 1. Clone with submodules
git clone --recursive https://github.com/sushantjagtap5543/track1.git
cd track1

# 2. Run the fixed installer (Ubuntu 22.04/24.04 recommended)
chmod +x install.sh
./install.sh
```

## Features
- Full Traccar core (devices, positions, geofences, commands, reports)
- SaaS layer (saas/) with MFA (TOTP + QR), JWT auth, vehicles, billing, admin
- Docker + Docker Compose (Postgres, Redis, Nginx reverse proxy)
- OpenAPI spec + Prisma ORM
- Ready for AWS Lightsail / production

## Environment Variables
Copy .env.example → .env and update secrets.

## Architecture
- Traccar backend → port 8082 (internal)
- SaaS API → port 3001 (Express + Prisma)
- Nginx → port 80/443 (proxy + rate limiting)
- Database → Postgres + Redis

All bugs fixed – see commit message for details.