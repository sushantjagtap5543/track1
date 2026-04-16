#!/bin/bash

# GeoSurePath Native (No-Docker) Setup Script
# Target: Ubuntu 22.04+ (AWS Lightsail)

set -e

echo "----------------------------------------------------"
echo "🌐 GEOSUREPATH NATIVE SETUP (PHASE 1)"
echo "----------------------------------------------------"

# 1. Update and Install Dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk postgresql postgresql-contrib redis-server nginx nodejs npm curl git jq

# 2. Database Setup
echo "🗄️ Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER geosurepath WITH PASSWORD 'SecurePass123!';" || true
sudo -u postgres psql -c "CREATE DATABASE geosurepath OWNER geosurepath;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE geosurepath TO geosurepath;" || true

# 3. Directory Structure
echo "📁 Setting up directory structure..."
sudo mkdir -p /opt/geosurepath/{backend,saas,frontend,logs,config}
sudo chown -R $USER:$USER /opt/geosurepath

# 4. Service Definitions (Systemd)
echo "⚙️ Creating systemd services..."

# Backend (Traccar)
cat <<EOF | sudo tee /etc/systemd/system/geosure-backend.service
[Unit]
Description=GeoSurePath Traccar Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/geosurepath/backend
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -Djava.net.preferIPv4Stack=true -jar tracker-server.jar traccar.xml
Restart=always
StandardOutput=append:/opt/geosurepath/logs/backend.log
StandardError=append:/opt/geosurepath/logs/backend.log

[Install]
WantedBy=multi-user.target
EOF

# SaaS API
cat <<EOF | sudo tee /etc/systemd/system/geosure-saas.service
[Unit]
Description=GeoSurePath SaaS API
After=network.target redis-server.service postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/geosurepath/saas
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
StandardOutput=append:/opt/geosurepath/logs/saas.log
StandardError=append:/opt/geosurepath/logs/saas.log

[Install]
WantedBy=multi-user.target
EOF

# 5. Nginx Configuration
echo "🌐 Configuring Nginx..."
cat <<EOF | sudo tee /etc/nginx/sites-available/geosurepath
server {
    listen 80;
    server_name _;

    # Frontend (Modern)
    location / {
        root /opt/geosurepath/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # SaaS API
    location /api/saas/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Traccar API
    location /api/ {
        proxy_pass http://localhost:8082/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/geosurepath /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "----------------------------------------------------"
echo "✅ NATIVE SETUP COMPLETE"
echo "Next steps:"
echo "1. Build tracker-server.jar and upload to /opt/geosurepath/backend"
echo "2. Build traccar-web and upload to /opt/geosurepath/frontend"
echo "3. Copy saas/ files to /opt/geosurepath/saas"
echo "4. Run: sudo systemctl enable --now geosure-backend geosure-saas"
echo "----------------------------------------------------"
