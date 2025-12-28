# NetConfig Manager

A self-hosted web application for managing Cisco and Juniper network switch configurations. Built for network administrators who need a clean, efficient interface to configure LACP groups, VLANs, port speeds, and other switch settings.

![NetConfig Manager Dashboard](docs/screenshot-dashboard.png)

## Features

### Multi-Vendor Support
- **Cisco** - Catalyst series switches with IOS/IOS-XE configuration
- **Juniper** - EX series switches with Junos configuration
- Unified interface for managing both vendors

### Network Configuration
- **VLAN Management** - Create, edit, and delete VLANs with descriptions
- **LACP/Port Channels** - Configure link aggregation groups with mode, load balancing, and min/max links
- **Port Configuration** - Set speed, duplex, access/trunk mode, native VLAN, and allowed VLANs
- **Bulk Operations** - Apply configurations across multiple ports

### Configuration Generation
- Generate vendor-specific CLI commands for:
  - Cisco IOS/IOS-XE syntax
  - Juniper Junos syntax
- Export configurations for deployment to physical devices

### Security & Access Control
- **Local Authentication** - Username/password login (works offline)
- **Role-Based Access** - Admin and user roles
- **Device Permissions** - Per-device access control (read, write, delete)
- **Session Management** - Secure session handling with PostgreSQL storage

### Self-Hosted
- **Docker Deployment** - Single command deployment with docker-compose
- **Offline Ready** - No external dependencies or cloud services required
- **PostgreSQL Backend** - Reliable data persistence with easy backup/restore

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/netconfig-manager.git
cd netconfig-manager

# Start the application
docker compose up -d
```

The application will be available at `http://localhost:5005`

### Default Credentials
- **Username:** `admin`
- **Password:** `password`

> **Important:** Change the default password after first login.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Set in docker-compose |
| `SESSION_SECRET` | Secret for session encryption | Random (set in production) |
| `COOKIE_SECURE` | Set to `true` for HTTPS | `false` |

### Production Deployment

For production deployments, set a secure session secret:

```bash
export SESSION_SECRET=$(openssl rand -base64 32)
docker compose up -d
```

If serving over HTTPS (recommended), also set:
```bash
export COOKIE_SECURE=true
```

## Screenshots

### Device Management
![Device List](docs/screenshot-devices.png)

### VLAN Configuration
![VLAN Management](docs/screenshot-vlans.png)

### Port Configuration
![Port Settings](docs/screenshot-ports.png)

### LACP Groups
![LACP Configuration](docs/screenshot-lacp.png)

### User Management (Admin)
![User Management](docs/screenshot-users.png)

## Architecture

```
netconfig-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components (Shadcn/ui)
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Data layer
│   └── authService.ts      # Authentication
├── shared/                 # Shared types and schemas
│   ├── schema.ts           # Zod schemas
│   └── models/             # Database models
├── Dockerfile              # Multi-stage build
└── docker-compose.yml      # Container orchestration
```

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui component library
- TanStack Query for data fetching
- Wouter for routing

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- bcrypt for password hashing
- Express sessions with PostgreSQL store

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/logout` | Logout and destroy session |
| GET | `/api/auth/user` | Get current user info |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List all devices |
| POST | `/api/devices` | Create a new device |
| GET | `/api/devices/:id` | Get device details |
| PATCH | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Delete device |

### VLANs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices/:id/vlans` | List VLANs for device |
| POST | `/api/devices/:id/vlans` | Create VLAN |
| PATCH | `/api/vlans/:id` | Update VLAN |
| DELETE | `/api/vlans/:id` | Delete VLAN |

### Interfaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices/:id/interfaces` | List interfaces |
| PATCH | `/api/interfaces/:id` | Update interface |

### LACP Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices/:id/lacp-groups` | List LACP groups |
| POST | `/api/devices/:id/lacp-groups` | Create LACP group |
| PATCH | `/api/lacp-groups/:id` | Update LACP group |
| DELETE | `/api/lacp-groups/:id` | Delete LACP group |

### Admin (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| DELETE | `/api/admin/users/:id` | Delete user |
| PATCH | `/api/admin/users/:id/role` | Change user role |
| PATCH | `/api/admin/users/:id/password` | Reset password |

## Backup & Restore

### Backup Database
```bash
docker compose exec db pg_dump -U netconfig netconfig > backup.sql
```

### Restore Database
```bash
docker compose exec -T db psql -U netconfig netconfig < backup.sql
```

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
```

## License

MIT License - See [LICENSE](LICENSE) for details.

---

**Powered by [Excite Networks](https://www.excitenetworks.net)**

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
