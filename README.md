# Ruhunu Cinema Ticket Booking System

A full-stack cinema ticket booking application built with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Orchestration: Docker Compose

## Features

- User registration and login
- Browse movies and showtimes
- Seat selection and booking flow
- Admin panel for cinema management
- Image uploads for movie assets

## Quick Start (Docker)

From the project root:

```bash
docker compose up --build
```

## Project URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017`

## Default Admin Login

- Admin page: `http://localhost:5173/admin`
- Email: `admin@cinema.local`
- Password: `admin123`

Important: Change default admin credentials and `JWT_SECRET` before production deployment.

## Environment Variables (API)

Current API environment variables are defined in `docker-compose.yml`:
- `PORT` (default `8000`)
- `MONGODB_URI` (default `mongodb://mongo:27017/cinema`)
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Local Development (Without Docker)

Backend:
```bash
cd backend
npm install
npm start
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Notes

- Uploaded files are stored in `backend/uploads` and served from `/uploads/...`.
- OTP shown in auth flows is for development/demo behavior.
