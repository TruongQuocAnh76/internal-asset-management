FROM node:22-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package*.json pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm prisma generate --schema=./src/core/database/schema.prisma
RUN pnpm build

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "start:dev"]

FROM base AS prod
WORKDIR /app
COPY --from=build /app/.output /app
EXPOSE 3000
CMD ["pnpm", "start"]