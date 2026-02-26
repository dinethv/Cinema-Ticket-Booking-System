# Ruhunu Cinema Ticket Booking System

Cinema ticket booking app with React (frontend), Express (backend), and MongoDB.

## Quick Start

1. Create environment file:

```powershell
Copy-Item .env.example .env
```

2. Start with Docker:

```bash
docker compose up --build -d
```

3. Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Main Features

- User login and registration
- Movie browsing and seat booking
- Booking confirmation with QR ticket
- Admin panel for movie and booking management

## Stop Services

```bash
docker compose down
```
