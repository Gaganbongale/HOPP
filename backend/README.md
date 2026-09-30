# Hubli-Dharwad Public Transport Planner - Backend

Production-grade, scalable backend for a Public Transport Planner MVP. This application provides transit routing, dynamic fare calculations, route comparisons, search history logs, and saved bookmarks for the Hubli-Dharwad region.

---

## 🛠️ Tech Stack & Key Features

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose ORM
- **Authentication**: JWT stateless authentication, password hashing with `bcryptjs`
- **Security**: 
  - `helmet` for secure HTTP response headers
  - `express-rate-limit` for DDoS protection (100 req / 15 mins)
  - `express-mongo-sanitize` for NoSQL injection prevention
  - `xss-clean` for cross-site scripting sanitation
  - CORS Whitelisting
- **Architecture**: Clean MVC Architecture, Service Layer, and Repository Pattern
- **Input Validation**: Robust parsing using `express-validator`
- **Logging**: Console & file Logging via `winston`
- **Testing**: Jest & Supertest

---

## 📂 Project Structure

```text
backend/
├── src/
│   ├── config/             # Configuration modules
│   │   └── database.js     # Mongoose connection setup
│   ├── models/             # Mongoose schemas (User, Route, Location, etc.)
│   ├── repositories/       # Data-access layers decoupling Models from Services
│   ├── services/           # Business-logic orchestrators
│   ├── controllers/        # HTTP handlers translating JSON to services
│   ├── middlewares/        # Custom Express middlewares (auth, validation, errors)
│   ├── validators/         # Input constraints utilizing express-validator
│   ├── routes/             # Express routes namespaces
│   ├── utils/              # Calculation helpers (Haversine, fares), response formatters, logs
│   ├── app.js              # Express app instantiation and middleware configuration
│   └── server.js           # Server entry point
├── tests/                  # Test suites
│   ├── unit/               # Math, distance, and fare validator unit tests
│   └── integration/        # Route search, comparison, and authentication integration tests
├── .env.example            # Environment template config
├── API_DOCUMENTATION.md    # Detailed API endpoints list
└── Hubli_Dharwad_Transit_Planner.postman_collection.json # Postman requests collection
```

---

## 🚀 Installation & Setup

### 1. Clone & Install Dependencies
Navigate into the `backend/` directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` into a new file named `.env`:
```bash
cp .env.example .env
```
Ensure your MongoDB connection URI and JWT secrets are correct:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hubli_dharwad_transit
JWT_SECRET=super_secret_jwt_key_hubli_dharwad_2026
JWT_EXPIRES_IN=24h
NODE_ENV=development
CORS_ORIGIN=*
```

### 3. Seed Database
Make sure your MongoDB server is running, and populate default locations, routes, and credentials:
```bash
npm run seed
```
The normalized transit seeder is idempotent, validates references, and preserves unrelated data. It creates a Default Admin (`admin@planner.com` / `AdminPassword@123`) and a Regular User (`example@gmail.com` / `Password@123`).

For local transit planning without creating those demo accounts, use the transit-only seeder:
```bash
npm run seed:transit
```

Regenerate the audited JSON seed files after editing `seeds/generateSeedFiles.js`:
```bash
npm run seed:generate
```

See `TRANSIT_DATA_ARCHITECTURE.md` for the collection design, indexes, graph model, API plan, edge cases, and scalability recommendations.

### 4. Run Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5000`.

---

## 🧪 Testing

The codebase includes Jest-powered unit and integration test suites:

- **Run all tests (Requires running MongoDB)**:
  ```bash
  npm run test
  ```
- **Run Unit Tests only (Does not require MongoDB)**:
  ```bash
  npx jest tests/unit
  ```

---

## 🗺️ Transit Formulae

### Distance (Haversine Formula)
Calculates geographic distance in kilometers:
```javascript
const distance = R * c; // Great-circle distance between two GPS coordinates
```

### Dynamic Fare Rates
- **Bus**: `10 + (distance * 2)`
- **Auto**: `30 + (distance * 10)`
- **Cab**: `50 + (distance * 15)`

### Dynamic Duration Calculations
- **Bus**: (distance / 30 km/h) * 60 minutes
- **Auto**: (distance / 40 km/h) * 60 minutes
- **Cab**: (distance / 50 km/h) * 60 minutes
*Default speeds apply if no custom speeds are seeded in the database.*

### Multi-Criteria Comparisons (Balanced Route)
The system calculates a custom weight score to determinecheapest, fastest, and balanced routes:
$$\text{Score} = (W_{\text{fare}} \times \text{Fare}) + (W_{\text{time}} \times \text{Time})$$
The route optimizer selects the transport option with the *lowest score* as the balanced option.
# Ticket checkout setup

The BRTS ticket checkout uses Razorpay Standard Checkout. Copy `.env.example` to `.env` and set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `TICKET_BASE_FARE_RUPEES`, and `TICKET_FARE_PER_KM_RUPEES` before starting the API. The calculated fare is the base fare plus corridor distance multiplied by the per-kilometre rate. Use Razorpay test keys while testing; switch to live keys only for a production deployment. Checkout stays unavailable until all values are configured.

The backend creates each Razorpay order, verifies its signature and order notes, confirms the payment, and only then issues a unique ticket QR. Ticket records are stored in MongoDB. Scanning the ticket QR opens `GET /api/tickets/:ticketId`, which returns the ticket's validity and journey details. The optional “Pay by UPI QR” flow creates a Razorpay single-use QR and checks payment status; the Razorpay account must have QR Codes API access enabled.
