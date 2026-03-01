#!/usr/bin/env bash
set -e

: "${CI_REGISTRY:?CI_REGISTRY is required}"
: "${CI_REGISTRY_IMAGE:?CI_REGISTRY_IMAGE is required}"
: "${CI_REGISTRY_USER:?CI_REGISTRY_USER is required}"
: "${CI_REGISTRY_PASSWORD:?CI_REGISTRY_PASSWORD is required}"

FE_IMAGE="$CI_REGISTRY_IMAGE/frontend:latest"
BE_IMAGE="$CI_REGISTRY_IMAGE/backend:latest"

echo "Logging into Docker Registry..."
echo "$CI_REGISTRY_PASSWORD" | docker login "$CI_REGISTRY" \
  -u "$CI_REGISTRY_USER" \
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

