# NetConfig Manager

## Overview

NetConfig Manager is an enterprise network switch configuration tool designed for network administrators to manage Cisco and Juniper devices. The application provides a modern web interface for configuring LACP groups, VLANs, port speed, and other network switch settings. It follows a clean, technical interface design inspired by Carbon Design System and Linear, emphasizing clarity, precision, and efficiency for enterprise data-heavy workflows.

## Recent Changes

- **December 2024**: Changed to local username/password authentication for offline deployment
- **December 2024**: Implemented role-based access control (ACL) for device permissions
- **December 2024**: Protected all API routes with authentication middleware
- **December 2024**: Added admin-only permission management endpoints

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication & Authorization

### Authentication
- Uses local username/password authentication (works offline)
- Password hashing with bcrypt (10 rounds)
- Session management with PostgreSQL-backed sessions (connect-pg-simple)
- Login/register page at `/` for unauthenticated users

### Authorization (ACL)
- **Roles**: `admin` (full access to all devices) and `user` (access based on permissions)
- **Device Permissions**: Per-device access control with `canRead`, `canWrite`, `canDelete` flags
- First user to register becomes admin automatically

### Key Auth Files
- `server/authService.ts` - Local authentication service (register, login, bcrypt hashing)
- `server/permissionStorage.ts` - Device permission management
- `shared/models/auth.ts` - Auth-related types and Zod schemas
- `client/src/hooks/use-auth.ts` - Frontend auth hook with login/register mutations
- `client/src/pages/login.tsx` - Login/register page

### Auth API Endpoints
- `POST /api/auth/register` - Register new user (username, password, displayName)
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout (destroys session)
- `GET /api/auth/user` - Get current authenticated user

### Permission API Endpoints
- `GET /api/me/permissions` - Get current user's device permissions
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/permissions` - Grant device access (admin only)
- `DELETE /api/admin/permissions/:userId/:deviceId` - Revoke access (admin only)
- `PATCH /api/admin/users/:userId/role` - Set user role (admin only)

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Typography**: Inter for UI text, JetBrains Mono for configuration/code display

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API endpoints under `/api/` prefix
- **Development**: Vite middleware integration for HMR during development
- **Production**: Static file serving from built assets

### Data Layer
- **ORM**: Drizzle ORM for database operations
- **Schema**: Zod-based validation with drizzle-zod integration
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Storage Pattern**: Abstract storage interface in `server/storage.ts` supporting multiple implementations

### Shared Code
- **Schema Definitions**: Located in `shared/schema.ts`, shared between client and server
- **Type Safety**: Full TypeScript coverage with shared types for devices, interfaces, VLANs, and LACP groups

### Build System
- **Client Build**: Vite builds to `dist/public`
- **Server Build**: esbuild bundles server with selective dependency bundling for faster cold starts
- **Database Migrations**: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- PostgreSQL database (required, configured via `DATABASE_URL` environment variable)
- Drizzle Kit for schema management and migrations

### UI Dependencies
- Radix UI primitives for accessible component foundations
- Tailwind CSS for styling
- Lucide React for icons
- Google Fonts CDN for Inter and JetBrains Mono fonts

### Development Tools
- Replit-specific Vite plugins for development banner and cartographer (dev only)
- Runtime error overlay for debugging

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `react-hook-form` with `@hookform/resolvers`: Form handling and validation
- `zod`: Schema validation
- `wouter`: Client-side routing
- `date-fns`: Date formatting utilities

## Self-Hosted Deployment (Docker)

### Quick Start
```bash
# Clone or download the project, then:
docker compose up -d
```

The app will be available at `http://localhost:5000`. The first user to register becomes the admin.

### Production Deployment
For production, set a secure session secret:

```bash
# Generate a secure secret
export SESSION_SECRET=$(openssl rand -base64 32)

# Start containers
docker compose up -d
```

### Docker Files
- `Dockerfile` - Multi-stage build for optimized production image
- `docker-compose.yml` - Orchestrates app and PostgreSQL containers
- `.dockerignore` - Excludes unnecessary files from build

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (set automatically in docker-compose)
- `SESSION_SECRET` - Secret key for session encryption (required for production)

### Data Persistence
Database data is stored in a Docker volume (`postgres_data`). To backup:
```bash
docker compose exec db pg_dump -U netconfig netconfig > backup.sql
```

To restore:
```bash
docker compose exec -T db psql -U netconfig netconfig < backup.sql
```