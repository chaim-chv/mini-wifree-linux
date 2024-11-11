#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print error message and exit
error_exit() {
    echo -e "${RED}Error: $1${NC}" 1>&2
    exit 1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Require script to be executed as root
if [ "$EUID" -ne 0 ]; then
    error_exit "This script must be run as root (sudo)"
fi

echo -e "${GREEN}Starting installation...${NC}"

# Check if NodeJS is installed
echo "Checking system requirements (NodeJS)..."

if ! command_exists node; then
    error_exit "NodeJS is not installed. Please install NodeJS before running this script."
fi

echo -e "${GREEN}NodeJS is installed.${NC}"

# Create directory for the application
echo "Creating directory for the application..."
mkdir -p /opt/mini-wifree
mkdir -p /var/log/mini-wifree || error_exit "Failed to create log directory"

# Copy application files
echo "Copying application files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r $SCRIPT_DIR/* /opt/mini-wifree || error_exit "Failed to copy application files"
cp $SCRIPT_DIR/mini-wifree.service /etc/systemd/system/ || error_exit "Failed to copy systemd service file"

# Install dependencies
echo "Installing dependencies..."
cd /opt/mini-wifree
npm install || error_exit "Failed to install dependencies"

# Set permissions
echo "Setting permissions..."
chown -R root:root /opt/mini-wifree
chmod -R 755 /opt/mini-wifree
chown -R root:root /var/log/mini-wifree
chmod -R 755 /var/log/mini-wifree

# Enable and start the service
echo "Enabling and starting the service..."
systemctl daemon-reload || error_exit "Failed to reload systemd"
systemctl enable mini-wifree || error_exit "Failed to enable service"
systemctl start mini-wifree || error_exit "Failed to start service"

echo -e "${GREEN}Installation complete.${NC}"