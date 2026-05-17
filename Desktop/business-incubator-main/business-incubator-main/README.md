# Business Incubator

A lightweight startup incubator platform with a static HTML/CSS/JS client and an Express + MongoDB backend.

## What is working

- User registration and login for startup founders, mentors, and investors
- Password reset flow with expiring reset tokens
- Founder dashboard with startup create, edit, and delete flows
- Mentor profile create and edit flows
- Mentor request submission and mentor-side accept/reject handling
- Funding board with saved investor interest and portfolio persistence
- Resource browsing with filtering and useful-vote tracking
- Contact inquiry submission with admin-side review
- Route-level validation and rate limiting for sensitive write APIs

## Local setup

1. Install backend dependencies from the project root:

```bash
npm run install:server
```

2. Create a `.env` file inside `server/` using `server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/business-incubator
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
CLIENT_ORIGIN=http://localhost:5000
```

3. Start MongoDB locally.

4. Optional: seed demo data:

```bash
npm run seed
```

5. Optional: create or update an admin account without clearing existing data:

```bash
npm run admin:create
```

This uses `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `server/.env`, with demo defaults shown in `server/.env.example`.

6. Start the full website:

```bash
npm run dev
```

7. Open `http://localhost:5000`.

The Express app serves both the API and the static client. API routes live under `/api/*`; website pages and assets are served from `client/`.

## Demo accounts after seeding

- Founder: `founder@example.com` / `password123`
- Mentor: `mentor@example.com` / `password123`
- Investor: `investor@example.com` / `password123`
- Admin: `admin@example.com` / `password123`

Admins can open `http://localhost:5000/admin.html` to review users, startups, mentors, resources, and verification status.

## Next ideas

- Add automated tests for the controllers and browser flows
- Add profile editing UI for bios and avatars
- Add email notifications for contact messages
- Move from plain JS pages to a component-based frontend if the app grows

## Production notes

- Set `NODE_ENV=production`.
- Set `MONGODB_URI` to your production MongoDB connection string.
- Set `JWT_SECRET` to a long random secret.
- Optionally set `RESET_PASSWORD_EXPIRE_MINUTES`; it defaults to 15.
- Set `CLIENT_ORIGIN` to your deployed website origin, for example `https://your-domain.com`. Use a comma-separated list if you need multiple allowed origins.
- Deploy from the repository root with `npm start`; the server will serve the client and API from the same origin.
