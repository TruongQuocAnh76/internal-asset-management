#!/usr/bin/env bash
set -e

: "${DOCKER_REGISTRY:?DOCKER_REGISTRY is required}"
: "${DOCKER_USERNAME:?DOCKER_USERNAME is required}"
: "${DOCKER_PASSWORD:?DOCKER_PASSWORD is required}"

FE_IMAGE="$DOCKER_REGISTRY/asset-management-frontend:latest"
BE_IMAGE="$DOCKER_REGISTRY/asset-management-backend:latest"

echo "Logging into Docker Registry..."
echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" \
  -u "$DOCKER_USERNAME" \
  --password-stdin

echo "Pulling latest images..."
docker pull "$FE_IMAGE"
docker pull "$BE_IMAGE"

echo "Retagging images for docker compose..."
docker tag "$FE_IMAGE" asset-management-frontend:latest
docker tag "$BE_IMAGE" asset-management-backend:latest

echo "Running Prisma migrations..."
docker run --rm \
  --env-file ./be/.env \
  --network host \
  "$BE_IMAGE" \
  pnpm prisma migrate deploy

echo "Starting services..."
docker compose -f docker-compose.yml up -d --no-build

echo "Removing dangling images..."
docker image prune -f

echo "Deploy complete."

