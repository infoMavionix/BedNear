# BedNear Backend Starter

Node.js + Express + TypeScript + PostgreSQL + Prisma. Includes JWT owner authentication, dashboard summary, PG listing CRUD, rooms, beds, enquiries, profile and public published-listing endpoints.

## Setup on Windows PowerShell
1. Extract this folder into `C:\Users\kaveri\Desktop\BedNear\backend` (or copy these files into the existing backend folder).
2. Open PowerShell in the backend folder and run:

```powershell
npm.cmd install
Copy-Item .env.example .env
```

3. Edit `.env` and set your PostgreSQL password in `DATABASE_URL`. Set `JWT_SECRET` to a random secret at least 32 characters long. Create a PostgreSQL database named `bednear` using pgAdmin or run `CREATE DATABASE bednear;` in a SQL query tool.
4. Run:

```powershell
npx.cmd prisma generate
npx.cmd prisma migrate dev --name init
npm.cmd run dev
```

Health check: `http://localhost:5000/health`

## Important API endpoints
- `POST /api/v1/auth/register` — `{ "name":"PG Owner", "email":"owner@example.com", "password":"ChangeThis123", "phone":"9876543210" }`
- `POST /api/v1/auth/login` — returns `token` and `user`
- Protected endpoints need `Authorization: Bearer <token>`
- `GET /api/v1/dashboard/summary`
- `GET/POST /api/v1/listings`; `GET/PATCH/DELETE /api/v1/listings/:id`
- `GET/POST /api/v1/rooms`; `PATCH/DELETE /api/v1/rooms/:id`
- `GET/POST /api/v1/beds`; `PATCH/DELETE /api/v1/beds/:id`
- `GET /api/v1/enquiries`; `PATCH /api/v1/enquiries/:id`
- `POST /api/v1/enquiries/public` for candidate enquiry submission
- `GET/PATCH /api/v1/profile`; `PATCH /api/v1/profile/password`
- `GET /api/v1/public/listings?city=Bengaluru&locality=Vijayanagar&search=Green`
- `GET /api/v1/public/listings/:id`

For the dashboard, add `VITE_API_BASE_URL=http://localhost:5000/api/v1` to `owner-dashboard/.env` and restart Vite. API is not yet connected to the current demo React page state; frontend service calls still need to be wired in. For testing on a physical phone, use your computer's LAN IP instead of `localhost`.

This is an MVP starter. Before production, add rate limiting, stricter security headers, request logging, image storage, tests, backup strategy and deployment configuration. Do not commit `.env` or share JWT/database secrets.
