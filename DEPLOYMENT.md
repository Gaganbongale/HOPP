# Deploy Hop for browser access

This deployment serves the built frontend and API from one HTTPS website. Visitors only need a browser; they do not install Node, MongoDB, or this repository. Docker Compose runs the app, a private MongoDB container, and Caddy for HTTPS.

## Requirements

- A Linux server or VM with Docker Engine and the Docker Compose plugin.
- A domain name whose DNS `A` record points to the server. Allow inbound TCP ports 80 and 443 (and UDP 443 for HTTP/3).
- Docker Compose v2.

## Configure and start

1. Copy `.env.production.example` to `.env` in the project root. Keep `.env` private; it is ignored by Git and excluded from the Docker build.
2. Set `SITE_DOMAIN` and `CORS_ORIGIN` to your actual domain. For example, `SITE_DOMAIN=hop.example.com` and `CORS_ORIGIN=https://hop.example.com`.
3. Generate separate secrets for `MONGO_ROOT_PASSWORD` and `JWT_SECRET`. On a machine with OpenSSL, `openssl rand -hex 32` generates URL-safe values. Put them in `.env`; do not use the example values.
4. Set `GOOGLE_CLIENT_ID` to the Google OAuth web client ID if Google sign-in is wanted. Add `https://<your-domain>` as an authorized JavaScript origin in Google Cloud.
5. Set the Razorpay credentials on the server if ticket checkout is wanted. Use test keys for testing and live keys only when payments are ready to accept real money.
6. From the project root, run:

   ```sh
   docker compose up -d --build
   docker compose exec app npm run seed:transit
   ```

7. Open `https://<your-domain>` in any browser. Caddy requests and renews the HTTPS certificate automatically once DNS points to the server and ports 80/443 are reachable.

The MongoDB port is not published to the internet. Its data persists in the `transit_mongo_data` Docker volume. Back up that volume regularly. Keep a private copy of `.env` so the app can be recovered.

## Updating the site

Pull or copy the updated project to the server, then run `docker compose up -d --build`. The site URL stays the same and visitors do not need project files.

To inspect startup and request logs, run `docker compose logs -f app` or `docker compose logs -f web`.

## Local development

The Vite development server proxies `/api` to `http://localhost:5000`, so the frontend uses the same relative API path in development and production. Start the backend and MongoDB as usual, then run `npm run dev` from `frontend/`. The Vite server listens on the network; another device on the same Wi-Fi can open `http://<computer-lan-ip>:5173` while the computer running the backend remains on. Public browser access requires the deployment steps above.
