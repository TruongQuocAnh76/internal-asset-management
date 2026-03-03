FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm build

FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM node:22-slim AS prod
WORKDIR /app
COPY --from=build /app/.output ./.output
EXPOSE 5173
CMD ["node", "./.output/server/index.mjs"]