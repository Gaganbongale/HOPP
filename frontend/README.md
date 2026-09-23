# Hop frontend

React + Vite frontend for the Hubli–Dharwad transit planner.

## Run locally

1. Start MongoDB and make sure the transit collections are populated.
2. In `backend/`, install its dependencies with `npm install`, then configure `backend/.env` using `.env.example`. Set a private `JWT_SECRET`, and provide `MONGODB_URI`, `PORT=5000`, and `NODE_ENV=development`.
3. Start the API in `backend/` with `npm run dev`.
4. In `frontend/`, run `npm install` and `npm run dev`, then open the Vite URL (normally `http://localhost:5173`).

The frontend calls `http://localhost:5000/api` by default. To use another API address, create `frontend/.env` from `.env.example` and set `VITE_API_URL` (for example, `http://localhost:5000/api`). Restart Vite after changing environment variables.

If the planner says the API is unreachable, check that the backend started successfully and that its MongoDB connection is available. If the API responds but routes are not found, load the transit seed data into the configured database.
