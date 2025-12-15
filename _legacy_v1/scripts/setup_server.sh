#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Flashcard Server Provisioning..."

# 1. Update System
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Essentials & Caddy
echo "🌐 Installing Caddy Web Server..."
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl

if ! command -v caddy &> /dev/null; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
    echo "✅ Caddy installed."
else
    echo "✅ Caddy already installed."
fi

# 3. Setup Directories
echo "📂 Setting up web directories..."
mkdir -p /var/www/flashcards
mkdir -p /var/www/flashcards-staging
chown -R ubuntu:ubuntu /var/www/flashcards /var/www/flashcards-staging
chmod -R 755 /var/www

# 4. Configure# Firewall Setup (The Safe Way)
echo "🔒 Configuring Firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "   Allowing SSH/HTTP/HTTPS..."
ufw --force enable
echo "✅ Firewall Active (SSH Port 22 Protected)"

# 5. Setup Block Volume (Backup)
echo "💾 Checking for Backup Volume..."
# Paravirtualized volumes usually show up as /dev/sdb used or unused
if [ -b /dev/sdb ]; then
    echo "   Found /dev/sdb. Checking if formatted..."
    if ! blkid /dev/sdb > /dev/null; then
        echo "   Formatting /dev/sdb (ext4)..."
        mkfs.ext4 -F /dev/sdb
    fi

    echo "   Mounting to /var/www/backups..."
    mkdir -p /var/www/backups
    # Add to fstab for persistence on reboot
    if ! grep -q "/dev/sdb" /etc/fstab; then
        echo "/dev/sdb /var/www/backups ext4 defaults 0 0" >> /etc/fstab
    fi
    mount -a
    chown -R ubuntu:ubuntu /var/www/backups
    echo "✅ Backup Volume Mounted."
else
    echo "⚠️ No secondary volume found (/dev/sdb). Skipping mount."
fi

# 6. Output Success
echo "🎉 Server Provisioning Complete!"
echo "👉 Next Step: Update /etc/caddy/Caddyfile with your domain config."
