#!/usr/bin/env bash

set -e

# ---- config ----
APP_NAME="devfleet-agent"
VERSION=${1:-"dev"}   # pass version like: ./build.sh v0.1.0
DIST_DIR="dist"

# ---- prep ----
echo "Cleaning old builds..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "Ensuring dependencies..."
go mod tidy
go mod verify

# ---- platforms ----
platforms=(
  "linux/amd64"
  "linux/arm64"
  "darwin/amd64"
  "darwin/arm64"
  "windows/amd64"
)

# ---- build ----
for platform in "${platforms[@]}"; do
  IFS="/" read -r GOOS GOARCH <<< "$platform"

  output="$DIST_DIR/$APP_NAME-$GOOS-$GOARCH"
  if [ "$GOOS" = "windows" ]; then
    output+=".exe"
  fi

  echo "Building $output..."

  CGO_ENABLED=0 GOOS=$GOOS GOARCH=$GOARCH \
    go build \
      -ldflags="-s -w -X main.version=$VERSION" \
      -o "$output"

done

echo "Build complete. Binaries in ./$DIST_DIR"
