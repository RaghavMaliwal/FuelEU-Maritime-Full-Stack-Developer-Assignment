# Fuel EU Maritime - Compliance Platform

A full-stack application for managing Fuel EU Maritime compliance, including route tracking, compliance balance calculation, banking, and pooling operations.

## Overview

This platform implements a Fuel EU Maritime compliance dashboard with:
- **Routes Management**: Track vessel routes with GHG intensity, fuel consumption, and emissions data
- **Comparison Analysis**: Compare routes against baseline and target intensity (89.3368 gCO₂e/MJ)
- **Banking (Article 20)**: Bank surplus compliance balance and apply to deficits
- **Pooling (Article 21)**: Create compliance pools to balance deficits across multiple ships

## Screenshots

Here’s a quick visual walkthrough of the Fuel EU Maritime Compliance Platform:

| Tab | Screenshot |
|-----|-------------|
| **Routes Management** | ![Routes Tab](./screenshots/routes_tab.png) |
| **Comparison Analysis** | ![Comparison Tab](./screenshots/comparison_tab.png) |
| **Banking (Article 20)** | ![Banking Tab](./screenshots/banking_tab.png) |
| **Pooling (Article 21)** | ![Pooling Tab](./screenshots/pooling_tab.png) |

Each tab provides an interactive interface to view, compare, and manage compliance data efficiently.

## Architecture

The application follows **Hexagonal Architecture (Ports & Adapters)** pattern:

### Backend Structure
```
src/
  core/
    domain/          # Domain entities and types
    application/     # Use cases (business logic)
    ports/           # Interfaces (repository contracts)
  adapters/
    inbound/http/    # Express routes (HTTP adapter)
    outbound/postgres/ # Prisma repositories (database adapter)
  infrastructure/
    db/              # Database migrations and seeds
    server/           # Server setup and dependency injection
```

### Frontend Structure
```
src/
  core/
    domain/          # Type definitions
    application/     # Use case classes
    ports/           # API client interface
  adapters/
    infrastructure/  # Axios API client implementation
    ui/              # React components (UI adapter)
```

**Key Principles:**
- Core layer has **zero framework dependencies** (no Express, React, Prisma in core)
- Business logic is framework-agnostic and testable
- Adapters implement ports, allowing easy swapping (e.g., swap Prisma for MongoDB)

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest + Supertest
- **Validation**: Zod

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **HTTP Client**: Axios

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ (running locally or remote)
- Git

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/fueleu?schema=public"
PORT=4000
```

4. **Set up database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample routes
npm run db:seed
```

5. **Start development server:**
```bash
npm run dev
```

The backend will run on `http://localhost:4000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API requests to the backend.

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

This runs:
- **Unit tests**: All service classes (RouteService, ComplianceService, BankingService, PoolingService)
- **Integration tests**: All HTTP endpoints via Supertest

**Test Coverage:**
- 52 tests total
- All tests passing
- Covers edge cases: negative CB, invalid pools, over-apply scenarios

### Frontend Tests

```bash
cd frontend
npm test
```

*(Frontend tests can be added using React Testing Library)*

## API Endpoints

### Routes
- `GET /routes` - Get all routes
- `POST /routes/:id/baseline` - Set baseline route
- `GET /routes/comparison` - Get baseline vs comparison data

### Compliance
- `GET /compliance/cb?shipId=SHIP001&year=2024` - Compute and get compliance balance
- `GET /compliance/adjusted-cb?shipId=SHIP001&year=2024` - Get adjusted CB (with banking)

### Banking
- `GET /banking/records?shipId=SHIP001&year=2024` - List bank records
- `POST /banking/bank` - Bank surplus CB
  ```json
  { "shipId": "SHIP001", "year": 2024 }
  ```
- `POST /banking/apply` - Apply banked amount
  ```json
  { "shipId": "SHIP001", "year": 2024, "amount": 100000 }
  ```

### Pooling
- `POST /pools` - Create compliance pool
  ```json
  {
    "year": 2024,
    "members": [
      { "shipId": "SHIP001", "cb": 100000 },
      { "shipId": "SHIP002", "cb": -50000 }
    ]
  }
  ```

## Sample Data

The seed script creates 5 sample routes:
- R001: Container, HFO, 2024, 91.0 gCO₂e/MJ (baseline)
- R002: BulkCarrier, LNG, 2024, 88.0 gCO₂e/MJ
- R003: Tanker, MGO, 2024, 93.5 gCO₂e/MJ
- R004: RoRo, HFO, 2025, 89.2 gCO₂e/MJ
- R005: Container, LNG, 2025, 90.5 gCO₂e/MJ

## Key Formulas

### Compliance Balance (CB)
```
Energy in scope (MJ) = fuelConsumption (t) × 41,000 MJ/t
CB = (Target Intensity - Actual Intensity) × Energy in scope
```

Where:
- **Target Intensity (2025)**: 89.3368 gCO₂e/MJ (2% below 91.16)
- **Positive CB**: Surplus (can be banked)
- **Negative CB**: Deficit (needs banking or pooling)

### Comparison Percentage
```
percentDiff = ((comparison / baseline) - 1) × 100
```

## Project Structure

```
FuelEU-Maritime-Full-Stack-Developer-Assignment/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── core/           # Business logic (framework-agnostic)
│   │   ├── adapters/       # Framework implementations
│   │   └── infrastructure/ # Server, DB setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── core/           # Domain & use cases
│   │   ├── adapters/       # API client & UI
│   │   └── App.tsx
│   └── package.json
├── AGENT_WORKFLOW.md       # AI agent usage documentation
├── README.md               # This file
└── REFLECTION.md           # Reflection on AI agent usage
```

## Development Commands

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Run production build
npm test            # Run all tests
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

## Sample API Requests

### Get All Routes
```bash
curl http://localhost:4000/routes
```

### Set Baseline Route
```bash
curl -X POST http://localhost:4000/routes/1/baseline
```

### Get Comparison Data
```bash
curl http://localhost:4000/routes/comparison
```

### Compute Compliance Balance
```bash
curl "http://localhost:4000/compliance/cb?shipId=SHIP001&year=2024"
```

### Bank Surplus
```bash
curl -X POST http://localhost:4000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"SHIP001","year":2024}'
```

### Create Pool
```bash
curl -X POST http://localhost:4000/pools \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "members": [
      {"shipId": "SHIP001", "cb": 100000},
      {"shipId": "SHIP002", "cb": -50000}
    ]
  }'
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check database exists: `createdb fueleu`

### Port Already in Use
- Backend: Change `PORT` in `.env` or kill process on port 4000
- Frontend: Vite will suggest alternative port automatically

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations

### Frontend Can't Connect to Backend
- Ensure backend is running on port 4000
- Check Vite proxy configuration in `vite.config.ts`
- Verify CORS is not blocking requests (if needed, add CORS middleware to Express)

## License

This project is part of a technical assignment.
