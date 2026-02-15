# Ruhunu Cinema (React + Docker + MongoDB)

This project includes:

- React (Vite) frontend
- Docker Compose
- Node.js + Express
- MongoDB

## Run

```bash
docker compose up --build
```

Apps will be available at:

- Frontend: `http://localhost:5173`
- `http://localhost:8000`
- Health check: `http://localhost:8000/health`

## What you can do in the React app

- Register and login with customer accounts
- Add movies
- Add trailer URL and photo URLs for movies
- Upload local movie photos and trailer video files from admin page
- Add showtimes
- Delete movies (admin only)
- Edit movie details (admin only)
- Create and apply promo code discounts
- Book seats
- View shows and bookings in real time
- Require customer details when booking: name, mobile number, NIC
- Admin can view all customer booking details

## Admin access

- Admin page route: `http://localhost:5173/admin`
- Only admin users can access it.
- Default admin credentials:
  - Email: `admin@cinema.local`
  - Password: `admin123`

Use `http://localhost:5173/login` to sign in. Non-admin users are redirected away from `/admin`.

## API Endpoints

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /movies`
- `PUT /movies/:id`
- `DELETE /movies/:id`
- `GET /movies`
- `POST /uploads/photos` (admin)
- `POST /uploads/video` (admin)
- `POST /shows`
- `GET /shows`
- `POST /promo-codes/validate` (auth)
- `POST /admin/promo-codes` (admin)
- `GET /admin/promo-codes` (admin)
- `POST /bookings`
- `GET /bookings`
- `GET /admin/bookings` (admin)
- `DELETE /bookings/:id`

Uploaded files are stored locally in `backend/uploads` and served via `/uploads/...`.

## API example flow

1. Login and get token:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@cinema.local\",\"password\":\"admin123\"}"
```

2. Create a movie (replace `TOKEN`):

```bash
curl -X POST http://localhost:8000/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"title\":\"Interstellar\",\"durationMinutes\":169,\"genre\":\"Sci-Fi\"}"
```

3. Create a show (replace `movieId` and `TOKEN`):

```bash
curl -X POST http://localhost:8000/shows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"movieId\":\"YOUR_MOVIE_ID\",\"hallName\":\"Hall A\",\"startTime\":\"2026-02-20T18:00:00.000Z\",\"ticketPrice\":12.5,\"totalSeats\":60}"
```

4. Book seats (replace `showId`):

```bash
curl -X POST http://localhost:8000/bookings \
  -H "Content-Type: application/json" \
  -d "{\"showId\":\"YOUR_SHOW_ID\",\"customerName\":\"Alex\",\"seats\":[1,2,3]}"
```

Seats are protected from double booking. If a seat is already taken, the API returns `409`.
