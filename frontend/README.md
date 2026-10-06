# Hop frontend

React + Vite frontend for the Hubli–Dharwad transit planner.

## Run locally

1. Start MongoDB and make sure the transit collections are populated.
2. In `backend/`, install its dependencies with `npm install`, then configure `backend/.env` using `.env.example`. Set a private `JWT_SECRET`, and provide `MONGODB_URI`, `PORT=5000`, and `NODE_ENV=development`.
3. Start the API in `backend/` with `npm run dev`.
4. In `frontend/`, run `npm install` and `npm run dev`, then open the Vite URL (normally `http://localhost:5173`).

The frontend calls the relative `/api` path. Vite proxies it to the local backend during development; the production server serves the frontend and API from one HTTPS origin. To use a separate API host, set `VITE_API_URL` before building (for example, `https://api.example.com/api`). Restart Vite or rebuild after changing environment variables.

If the planner says the API is unreachable, check that the backend started successfully and that its MongoDB connection is available. If the API responds but routes are not found, load the transit seed data into the configured database.

For a browser-accessible deployment without project files on visitors' devices, follow [`../DEPLOYMENT.md`](../DEPLOYMENT.md).
