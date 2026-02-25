# Ruhunu Cinema Ticket Booking System

Full-stack cinema ticket booking application.

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Container orchestration: Docker Compose

## Features

- User registration and login
- Browse movies and showtimes
- Seat selection and booking flow
- Card payment form with booking confirmation
- Booking success page with downloadable receipt
- QR code ticket for theater entrance
- Admin panel for cinema management
- Admin entry verification (validate QR and mark check-in)
- Image uploads for movie assets

## Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for containerized run)

## Environment Setup

Create a local env file from template:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update these values before sharing or deploying:

- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Note:
- `.env` is used by Docker Compose variable substitution.
- If you run backend directly with `npm start`, set required environment variables in your shell.

## Run with Docker (Recommended)

From the project root:

```bash
docker compose up --build -d
```

Stop services:

```bash
docker compose down
```

Stop and remove database volume:

```bash
docker compose down -v
```

## Local Development (Without Docker)

1. Start MongoDB locally (default port `27017`) or run only Mongo with Docker:

```bash
docker compose up -d mongo
```

2. Start backend:

```bash
cd backend
npm install
npm start
```

3. Start frontend in a new terminal:

```bash
cd frontend
npm install
npm run dev
```

## Application URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017`

## Notes

- Uploaded files are stored in `backend/uploads` and served from `/uploads/...`.
- OTP shown in auth flows is for development/demo behavior.
- Payment flow is a demo implementation and does not process real transactions.
- QR ticket image generation currently uses `https://api.qrserver.com`.

## Public Repo Checklist

- Never commit real credentials, API keys, or production connection strings.
- Rotate secrets if they were ever committed in history.
- Keep `.env` private and commit only `.env.example`.
- Replace demo admin credentials and `JWT_SECRET` for any real deployment.
