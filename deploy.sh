#!/usr/bin/env bash
cd asset-management-monorepo
set -e

: "${GHCR_USERNAME:?GHCR_USERNAME is required}"
: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${GHCR_FE_IMAGE:?GHCR_FE_IMAGE is required}"
: "${GHCR_BE_IMAGE:?GHCR_BE_IMAGE is required}"

FE_IMAGE="$GHCR_FE_IMAGE"
BE_IMAGE="$GHCR_BE_IMAGE"

echo "Logging into Docker Registry..."
echo "$GHCR_TOKEN" | docker login ghcr.io \
  -u "$GHCR_USERNAME" \
  --password-stdin

echo "Pulling latest images..."
docker pull "$FE_IMAGE"
docker pull "$BE_IMAGE"

echo "Retagging images for docker compose..."
docker tag "$FE_IMAGE" asset-management-frontend:latest
docker tag "$BE_IMAGE" asset-management-backend:latest

echo "Running Prisma migrations and seeder..."
docker run --rm \
  --env-file ./be/.env \
  --network host \
  --workdir /app \
  "$BE_IMAGE" \
  sh -c "pnpm prisma migrate deploy --schema prisma/schema.prisma && node dist/core/database/seed.js"

echo "Starting services..."
docker compose -f docker-compose.yml up -d --no-build

echo "Removing dangling images..."
docker image prune -f

echo "Deploy complete."

