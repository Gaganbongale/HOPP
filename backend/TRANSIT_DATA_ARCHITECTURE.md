# Hubli-Dharwad Transit Data Architecture

## 1. System Analysis

The research describes a multimodal route-discovery platform for Hubballi-Dharwad. Its core data is a network of named transport stops, landmarks, operators, routes, weighted connections, and fare rules. The platform must support route-number search, stop and landmark discovery, nearby search, direct-route lookup, multimodal graph planning, fare estimation, user bookmarks, search history, and future analytics.

Business rules extracted from the research:

- Stops are graph nodes; route segments are weighted edges.
- Edge weights include distance, travel time, and fare so planners can optimize cheapest, fastest, balanced, or least-transfer journeys.
- Route stop order matters. Circular routes and direction-specific routes must not be inferred from names.
- Landmark coordinates are authoritative only where the research provides them.
- Feeder-only area names are stored without fabricated coordinates and carry low confidence.
- Auto fares are stop-pair estimates from community reports, not meter guarantees.
- NWKRTC city-bus distance bands changed in January 2025 and should be versioned.
- Chigari Samparka integrated fares must remain separate from their component fares and savings.
- Search and route requests are user-interaction data; they should be retained separately from the static network.
- Source confidence and notes are first-class data because several intermediate stops and schedules are estimated.

## 2. Collection Design

| Collection | Purpose | Key relationships |
| --- | --- | --- |
| `transportoperators` | NWKRTC, HDBRTS, railway, and local auto operators | Referenced by routes and fare rules |
| `transportstops` | All graph nodes: stops, stations, terminals, depots, airports, and feeder areas | Referenced by routes, segments, landmarks, and fares |
| `landmarks` | Searchable points of interest with verified coordinates | References nearby stops |
| `transitroutes` | Ordered, operator-owned services such as route 21, BRTS-1, and 17325 | References operator and ordered stops |
| `routesegments` | Graph-ready weighted connections | References from/to stops, optional route and operator |
| `farerules` | Distance-band, stop-pair, integrated, pass, and base-rate pricing | References operator and optional stop pair |
| `users` | Existing authenticated users | Own saved routes and interaction records |
| `savedroutes` | Existing user bookmarks | References user and existing MVP route |
| `travelhistories` | Existing search history | References user and existing MVP locations |

Future justified collections, not implemented yet: `routeRequests`, `searchLogs`, `feedback`, `vehiclePositions`, `serviceAlerts`, and aggregated `analytics`.

## 3. ER Diagram

```text
TransportOperator 1 ---- * TransitRoute
TransportOperator 1 ---- * FareRule
TransportOperator 1 ---- * RouteSegment

TransportStop * ---- * TransitRoute          (ordered through TransitRoute.stops)
TransportStop 1 ---- * RouteSegment          (fromStop)
TransportStop 1 ---- * RouteSegment          (toStop)
TransportStop * ---- * Landmark              (nearbyStops)
TransportStop 1 ---- * FareRule              (optional fromStop/toStop)

User 1 ---- * SavedRoute
User 1 ---- * TravelHistory
```

## 4. MongoDB Schema Definitions

- Identifiers use unique stable `code` or compound natural keys.
- Coordinates use GeoJSON `Point` in `[longitude, latitude]` order.
- Unknown coordinates are omitted, not guessed.
- Route stops are embedded because order is intrinsic to one route and read together.
- Route segments are separate because graph traversal queries them independently.
- Fare amounts store `min`, `average`, and `max` to preserve estimates and ranges.
- `dataConfidence`, `notes`, `active`, and timestamps support verification and non-destructive changes.

## 5. Mongoose Models

Implemented models:

- `src/models/TransportOperator.js`
- `src/models/TransportStop.js`
- `src/models/Landmark.js`
- `src/models/TransitRoute.js`
- `src/models/RouteSegment.js`
- `src/models/FareRule.js`

The models include enum validation, required fields, defaults, virtuals, static lookup helpers, instance methods, and indexes. Existing MVP models remain unchanged so current APIs continue to work.

## 6. Index Strategy

| Index | Reason |
| --- | --- |
| `TransportStop.code` unique | Stable reference and duplicate prevention |
| `TransportStop.location` 2dsphere sparse | Nearby stop search without indexing unknown coordinates |
| `TransportStop` text index | Stop-name, alias, and area search |
| `TransportStop.city + stopTypes + active` | Filtered stop browsing |
| `Landmark.code` unique | Duplicate prevention |
| `Landmark.location` 2dsphere | Nearby landmark search |
| `Landmark` text index | Landmark and category search |
| `TransitRoute.routeNumber + operator + direction` unique | Allows valid direction variants while preventing duplicates |
| `TransitRoute.stops.stop + mode + active` | Direct-route and stop-service lookup |
| `RouteSegment.fromStop + toStop + mode + route` unique | Prevents duplicate graph edges |
| `RouteSegment.fromStop + active + mode` | Fast adjacency-list traversal |
| `RouteSegment.mode + fare + durationMinutes` | Planner filtering and analytics |
| `FareRule.fromStop + toStop + mode + active` | Stop-pair fare lookup |
| `FareRule.mode + ruleType + active` | Distance-band and pass lookup |

## 7. Seed File Structure

```text
backend/
├── seeds/
│   ├── operators.seed.json
│   ├── stops.seed.json
│   ├── landmarks.seed.json
│   ├── routes.seed.json
│   ├── routeSegments.seed.json
│   ├── fares.seed.json
│   ├── users.seed.json
│   ├── generateSeedFiles.js
│   └── seedDatabase.js
└── src/scripts/seed.js
```

JSON files use stable codes instead of hard-coded ObjectIds. `seedDatabase.js` validates and resolves those codes to ObjectIds at runtime.

## 8. Complete Seed Data

The generated seed set contains:

- 4 operators
- 113 normalized stops and feeder areas
- 30 landmarks with coordinates from the research
- 41 routes covering BRTS, city bus, Chigari Samparka feeder, shared auto, train, and the reported April 2026 airport service
- 37 graph edges from the transport graph dataset
- 71 fare rules, including all 50 auto stop-pair estimates, 15 integrated Chigari Samparka fares, and the documented city-bus/BRTS rules
- 2 existing development users

Run `npm run seed:generate` after editing the audited source arrays. No transport coordinates are generated for locations lacking coordinates in the research.

## 9. Seeder Implementation

`npm run seed`:

- validates uniqueness and every stop/operator reference before database writes;
- resolves stable codes into ObjectIds;
- uses `bulkWrite` upserts for safe reruns and duplicate prevention;
- preserves unrelated and user-generated data;
- logs inserted data-set counts;
- supports transactions on replica sets when `SEED_USE_TRANSACTIONS=true`.

## 10. API Architecture

Planned REST endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/transit/routes` | Filter routes by mode, operator, stop, or active status |
| GET | `/api/transit/routes/search?q=` | Search route number and name |
| GET | `/api/transit/routes/:id` | Return route with ordered populated stops |
| GET | `/api/transit/stops` | Browse stops by city and type |
| GET | `/api/transit/stops/search?q=` | Search stop names, aliases, and areas |
| GET | `/api/transit/stops/nearby?lat=&lng=&radius=` | Geospatial stop search |
| GET | `/api/transit/stops/:id` | Stop details, serving routes, and adjacent edges |
| GET | `/api/transit/landmarks` | Browse landmarks |
| GET | `/api/transit/landmarks/search?q=` | Text search landmarks |
| GET | `/api/transit/landmarks/nearby?lat=&lng=&radius=` | Geospatial landmark search |
| GET | `/api/transit/fares` | Query fare rules by mode, operator, or stop pair |
| POST | `/api/transit/route-plan` | Plan graph journeys by optimization preference |

Recommended layers: route validators, controllers, services, repositories, graph planner utility, fare resolver, request logging middleware, and cached adjacency-list service.

## 11. Folder Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
├── validators/
├── app.js
└── server.js
```

Add future transit API modules under the existing ownership boundaries rather than mixing graph planning into controllers.

## 12. Edge Cases

- Missing or unknown stops: return a typed validation error and suggested text matches.
- Duplicate names: search by aliases and codes; never use name as the database identity.
- Invalid coordinates: reject out-of-range or reversed GeoJSON values.
- Unknown coordinates: exclude them from nearby search while keeping them searchable by name.
- Circular routes: store `direction: LOOP` and explicit ordered stops.
- Disconnected routes: return partial/no-route results without inventing edges.
- Route changes: set old records inactive or version schedules and fares; do not overwrite historical facts.
- Empty search results: return an empty list with normalized query metadata.
- Partial route information: retain confidence and notes, and avoid inferred timings or fares.
- Standalone MongoDB: seed without transactions; enable transaction mode only on a replica set.

## 13. Future Scalability Recommendations

- Cache adjacency lists and common stop-pair plans in Redis.
- Add GTFS-compatible trips, calendars, stop times, and service exceptions when official data becomes available.
- Add time-dependent edge weights for peak/off-peak routing.
- Store live vehicle positions in a short-retention collection or time-series database.
- Use Atlas Search for typo tolerance and multilingual aliases.
- Add route-request and search-log collections with TTL or archival policies.
- Precompute popular origin-destination paths and analytics aggregates.
- Version fare rules and service schedules instead of mutating history.
