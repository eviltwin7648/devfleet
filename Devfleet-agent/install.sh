#!/usr/bin/env bash
set -e

REPO="eviltwin7648/Devfleet-agent"
VERSION="agentv1.0.1"
TOKEN=$1

OS=$(uname | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# normalize arch
if [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

BINARY="devfleet-agent-$OS-$ARCH"
URL="https://github.com/$REPO/releases/download/$VERSION/$BINARY"

echo "Downloading $BINARY..."

curl -L "$URL" -o devfleet-agent
chmod +x devfleet-agent

echo "Installing..."
sudo mv devfleet-agent /usr/local/bin/

read -rp "Enter your DevFleet API URL: " API_URL < /dev/tty
API_URL=$(printf '%s' "$API_URL" | sed 's:/*$::')

if [ -z "$API_URL" ]; then
  echo "API URL cannot be empty."
  exit 1
fi

echo "Starting agent..."
devfleet-agent start --token="$TOKEN" --api-url="$API_URL"
