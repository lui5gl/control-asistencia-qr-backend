# Backend API - Node.js + Express + Prisma + PostgreSQL + TypeScript

Modern REST API built with Node.js, Express, Prisma ORM, PostgreSQL and TypeScript.

## Stack

- **Node.js** 24.13.1 (Alpine)
- **TypeScript** 5.x
- **Express** 4.x
- **Prisma** 5.x
- **PostgreSQL** 18.2
- **Docker** + Docker Compose

## Quick Start

```bash
# Setup environment
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
docker exec -it backend npm run prisma:migrate

# Seed database
docker exec -it backend npm run prisma:seed
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── prisma.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── user.routes.ts
│   ├── middlewares/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── models/
│   └── database/
│       ├── seeds/
│       └── migrations/
├── dist/                     # Compiled JS
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `GET /api` - API version
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Commands

### Docker
```bash
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose logs -f        # Logs
docker-compose restart        # Restart
docker-compose build          # Rebuild
```

### Prisma
```bash
npm run prisma:generate       # Generate client
npm run prisma:migrate        # Run migrations
npm run prisma:seed          # Seed database
npm run prisma:studio        # Open GUI
```

### Development
```bash
npm run dev                   # Start with tsx watch
npm run build                 # Compile TypeScript
npm start                     # Start production
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=development
PORT=3000
```

See `.env.example` for complete configuration.

## Features

- TypeScript for type safety
- RESTful API architecture
- Prisma ORM with migrations
- Docker containerization
- Hot reload in development
- PostgreSQL database
- CORS enabled
- Error handling middleware
- Database seeding

## License

MIT
