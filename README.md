# Ruhunu Cinema

Cinema ticket booking system with a React (Vite) frontend and a Node.js/Express + MongoDB backend (Docker Compose).

## Quick Start (Docker)

```bash
docker compose up --build
```

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Admin Login

- Admin page: `http://localhost:5173/admin`
- Default admin credentials:
  - Email: `admin@cinema.local`
  - Password: `admin123`

## Notes

- Uploaded files are stored in `backend/uploads` and served from `/uploads/...`.
- OTP shown in the UI for registration/forgot-password is temporary (dev/testing only).
