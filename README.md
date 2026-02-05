# Asset Management System

A full-stack monorepo for managing organizational assets with a NestJS backend and Nuxt frontend.

## Project Structure

```
├── be/              # NestJS backend
├── fe/              # Nuxt 3 frontend
└── package.json     # Root workspace configuration
```

## Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended package manager)
- PostgreSQL (for database)

## Installation

Install all dependencies across the monorepo:

```bash
pnpm install
```

## Environment Setup

### Backend (.env)
Create a `.env` file in the `be/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/asset_management
SESSION_SECRET_KEY=your_secret_key_here
APP_PORT=3000
```

### Frontend (.env)
Create a `.env` file in the `fe/` directory:

```env
NUXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

## Running the Project

### Development Mode (Both Frontend & Backend)
Run both services concurrently:

```bash
pnpm dev
```

### Frontend Only
```bash
pnpm dev:fe
```
Frontend will run on `http://localhost:3001`

### Backend Only
```bash
pnpm dev:be
```
Backend API will run on `http://localhost:3000`

## Database Setup

Initialize the database schema:

```bash
cd be
pnpm prisma migrate dev
```

## Building for Production

Build both frontend and backend:

```bash
pnpm build
```

Build frontend only:
```bash
pnpm build:fe
```

Build backend only:
```bash
pnpm build:be
```

## Running in Production

Start the backend server:

```bash
pnpm start
```

## Available Scripts

- `pnpm dev` - Run both Fe and Be in development mode
- `pnpm dev:fe` - Run frontend development server
- `pnpm dev:be` - Run backend development server
- `pnpm build` - Build both frontend and backend
- `pnpm build:fe` - Build frontend only
- `pnpm build:be` - Build backend only
- `pnpm start` - Start production backend server
- `pnpm test` - Run backend tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier