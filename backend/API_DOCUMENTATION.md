# Hubli-Dharwad Public Transport Planner - API Documentation

The Public Transport Planner API provides routing, transport option pricing, search comparison, location lookups, and saved route bookmarks for transit commuters in Hubli-Dharwad.

- **Base URL**: `/api` (local development default: `http://localhost:5000/api`)
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>` (for protected endpoints)
- **Rate Limit**: Max 100 requests per 15 minutes per IP address.

---

## Response Formats

### Success Response (2xx)
```json
{
  "success": true,
  "data": {},
  "message": "Success message description"
}
```

### Failure Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error message description",
  "error": {}
}
```

---

## 1. Authentication Module

### 1.1 Register
- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Srujan",
    "email": "example@gmail.com",
    "password": "Password@123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "_id": "603f9e8a...",
        "name": "Srujan",
        "email": "example@gmail.com",
        "role": "user",
        "profileImage": "",
        "savedRoutesCount": 0,
        "createdAt": "2026-06-02T15:15:00.000Z",
        "updatedAt": "2026-06-02T15:15:00.000Z"
      }
    }
  }
  ```

### 1.2 Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "example@gmail.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "_id": "603f9e8a...",
        "name": "Srujan",
        "email": "example@gmail.com",
        "role": "user",
        "profileImage": "",
        "savedRoutesCount": 0,
        "lastLogin": "2026-06-02T20:43:08.000Z"
      }
    }
  }
  ```

### 1.3 Get Profile
- **URL**: `/auth/profile`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "_id": "603f9e8a...",
      "name": "Srujan",
      "email": "example@gmail.com",
      "role": "user",
      "profileImage": "",
      "savedRoutesCount": 0
    }
  }
  ```

### 1.4 Update Profile
- **URL**: `/auth/profile`
- **Method**: `PUT`
- **Auth Required**: Yes (Bearer Token)
- **Request Body** (All fields optional):
  ```json
  {
    "name": "Srujan Updated",
    "profileImage": "https://avatar-url.com/profile.png"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "_id": "603f9e8a...",
      "name": "Srujan Updated",
      "email": "example@gmail.com",
      "role": "user",
      "profileImage": "https://avatar-url.com/profile.png",
      "savedRoutesCount": 0
    }
  }
  ```

### 1.5 Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: No (Token deleted client-side)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logout successful. Please delete your token.",
    "data": null
  }
  ```

---

## 2. Location Module

### 2.1 Get All Locations
- **URL**: `/locations`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Number of items per page (default: `10`, max: `100`)
  - `search`: Filter by name, area, or city (default: `""`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Locations retrieved successfully",
    "data": {
      "locations": [
        {
          "_id": "603f9e9a...",
          "name": "Hubli Railway Station",
          "area": "Station Road",
          "city": "Hubli",
          "latitude": 15.3524,
          "longitude": 75.1478,
          "landmark": "Near Chennamma Circle",
          "isActive": true
        }
      ],
      "total": 6,
      "page": 1,
      "pages": 1
    }
  }
  ```

### 2.2 Get Single Location
- **URL**: `/locations/:id`
- **Method**: `GET`
- **Auth Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Location retrieved successfully",
    "data": {
      "_id": "603f9e9a...",
      "name": "Hubli Railway Station",
      "area": "Station Road",
      "city": "Hubli",
      "latitude": 15.3524,
      "longitude": 75.1478,
      "landmark": "Near Chennamma Circle",
      "isActive": true
    }
  }
  ```

---

## 3. Route Search & Comparison Module

### 3.1 Search Route
- **URL**: `/routes/search`
- **Method**: `POST`
- **Auth Required**: Optional (If token provided, saves to user's search history)
- **Request Body**:
  ```json
  {
    "source": "Hubli Railway Station",
    "destination": "BVB College"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Route search completed",
    "data": {
      "routeId": "603f9eab...",
      "source": "Hubli Railway Station",
      "destination": "BVB College",
      "distanceKm": 4.44,
      "estimatedTime": 6,
      "transportOptions": [
        {
          "type": "Bus",
          "fare": 18.88,
          "time": 9
        },
        {
          "type": "Auto",
          "fare": 74.4,
          "time": 7
        },
        {
          "type": "Cab",
          "fare": 116.6,
          "time": 5
        }
      ]
    }
  }
  ```

### 3.2 Compare Transport Options
- **URL**: `/routes/compare`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `source`: Source location name
  - `destination`: Destination location name
  - `fareWeight`: Weight for fare in balanced score (default: `0.5`, range `0` to `1`)
  - `timeWeight`: Weight for time in balanced score (default: `0.5`, range `0` to `1`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Route comparison completed",
    "data": {
      "cheapest": {
        "type": "Bus",
        "fare": 18.88,
        "time": 9
      },
      "fastest": {
        "type": "Cab",
        "fare": 116.6,
        "time": 5
      },
      "balanced": {
        "type": "Bus",
        "fare": 18.88,
        "time": 9
      }
    }
  }
  ```

### 3.3 Popular Routes
- **URL**: `/routes/popular`
- **Method**: `GET`
- **Auth Required**: No
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Popular routes retrieved successfully",
    "data": [
      {
        "searchCount": 24,
        "source": {
          "_id": "603f9e9a...",
          "name": "Hubli Railway Station",
          "area": "Station Road",
          "city": "Hubli"
        },
        "destination": {
          "_id": "603f9ea0...",
          "name": "BVB College",
          "area": "Vidyanagar",
          "city": "Hubli"
        }
      }
    ]
  }
  ```

### 3.4 Recent Searches
- **URL**: `/routes/recent`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Recent searches retrieved successfully",
    "data": [
      {
        "_id": "603f9ebb...",
        "userId": "603f9e8a...",
        "sourceLocation": {
          "_id": "603f9e9a...",
          "name": "Hubli Railway Station"
        },
        "destinationLocation": {
          "_id": "603f9ea0...",
          "name": "BVB College"
        },
        "transportSelected": "Bus",
        "estimatedFare": 18.88,
        "estimatedDistance": 4.44,
        "estimatedTime": 9,
        "searchedAt": "2026-06-02T15:15:30.000Z"
      }
    ]
  }
  ```

---

## 4. Saved Routes Module

### 4.1 Save a Route
- **URL**: `/saved-routes`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "routeId": "603f9eab...",
    "nickname": "Daily Commute"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Route saved successfully",
    "data": {
      "_id": "603f9ecb...",
      "userId": "603f9e8a...",
      "routeId": {
        "_id": "603f9eab...",
        "sourceLocation": { "name": "Hubli Railway Station" },
        "destinationLocation": { "name": "BVB College" },
        "distanceKm": 4.44
      },
      "nickname": "Daily Commute",
      "createdAt": "2026-06-02T15:16:00.000Z"
    }
  }
  ```

### 4.2 Get Saved Routes
- **URL**: `/saved-routes`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Saved routes retrieved successfully",
    "data": [
      {
        "_id": "603f9ecb...",
        "userId": "603f9e8a...",
        "routeId": {
          "_id": "603f9eab...",
          "sourceLocation": { "name": "Hubli Railway Station" },
          "destinationLocation": { "name": "BVB College" },
          "distanceKm": 4.44
        },
        "nickname": "Daily Commute"
      }
    ]
  }
  ```

### 4.3 Delete Saved Route
- **URL**: `/saved-routes/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Saved route deleted successfully",
    "data": {
      "_id": "603f9ecb..."
    }
  }
  ```

---

## 5. Travel History Module

### 5.1 Get History
- **URL**: `/history`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Travel history retrieved successfully",
    "data": [
      {
        "_id": "603f9ebb...",
        "sourceLocation": {
          "name": "Hubli Railway Station"
        },
        "destinationLocation": {
          "name": "BVB College"
        },
        "transportSelected": "Bus",
        "estimatedFare": 18.88,
        "estimatedDistance": 4.44,
        "estimatedTime": 9,
        "searchedAt": "2026-06-02T15:15:30.000Z"
      }
    ]
  }
  ```

### 5.2 Delete History Item
- **URL**: `/history/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "History record deleted successfully",
    "data": {
      "_id": "603f9ebb..."
    }
  }
  ```

---

## 6. Admin APIs

Requires bearer authentication with `role === "admin"`.

### 6.1 Create Location
- **URL**: `/admin/locations`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "CBT Hubli",
    "area": "CBT Road",
    "city": "Hubli",
    "latitude": 15.3510,
    "longitude": 75.1375,
    "landmark": "Near Bus Terminal"
  }
  ```

### 6.2 Update Location
- **URL**: `/admin/locations/:id`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "landmark": "Opposite old Bus Stand"
  }
  ```

### 6.3 Soft Delete Location
- **URL**: `/admin/locations/:id`
- **Method**: `DELETE`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Location deleted successfully (soft delete)",
    "data": {
      "_id": "603f9e9a...",
      "isActive": false
    }
  }
  ```

### 6.4 Create Route
- **URL**: `/admin/routes`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "sourceLocation": "603f9e9a...",
    "destinationLocation": "603f9ea0...",
    "distanceKm": 4.44,
    "estimatedTimeMinutes": 10,
    "routePath": [
      { "latitude": 15.3524, "longitude": 75.1478 },
      { "latitude": 15.3715, "longitude": 75.1228 }
    ]
  }
  ```

### 6.5 Update Route
- **URL**: `/admin/routes/:id`
- **Method**: `PUT`

### 6.6 Delete Route
- **URL**: `/admin/routes/:id`
- **Method**: `DELETE`

### 6.7 Get Dashboard Stats
- **URL**: `/dashboard/stats`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Dashboard statistics retrieved successfully",
    "data": {
      "totalUsers": 120,
      "totalRoutes": 18,
      "totalSearches": 1420,
      "mostSearchedRoute": {
        "source": "Hubli Railway Station",
        "destination": "BVB College",
        "searchCount": 240
      }
    }
  }
  ```
