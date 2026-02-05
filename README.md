# Medication Interaction API

A REST API for managing medications and their interaction information (e.g. with food, alcohol, pregnancy, breastfeeding). Uses JWT for authentication.

> **PS:** This is a study based API that has a few manually added medication information. The plan was to use FASS API as a data source but unfortunately its too expensive(15000 SEK/year) to use FASS. I am thinking of an alternative currently.

---

## Prerequisites

- **Node.js** (v18 or similar)
- **MongoDB** running locally on `localhost:27017`

---

## How to run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start MongoDB** (if not already running)  
   Make sure MongoDB is running on `mongodb://localhost:27017`.

3. **Start the API**

   ```bash
   npm start
   ```

   The server runs on **port 3001**. You should see: `Server is running on port 3001`, `Connected to database`.

4. **Test the API**  
   Use the `medication-api.http` file in this repo (e.g. in VS Code or cursor with the REST Client extension).

---

## Base URL

```
http://localhost:3001
```

---

> **PS: Why auth?** This is one of the security threats I talked about in my video. Because my API
> gives safety information, it’s important that the interaction rules cannot be changed by
> unauthorized users. If someone changed them, the API could give unsafe advice

## Authentication

Most medication endpoints require a **JWT token**. Flow:

1. **Register** → `POST /auth/register` (email + password)
2. **Login** → `POST /auth/login` (email + password)  
   Response includes a **token**.
3. **Use the token** in requests that need auth:
   ```http
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

> **Tokens expire after1 minutes** (This is just for testing purpose for now). After that, use "Token expired, please log in again" as a signal to call login again and get a new token.

---

## Endpoints

| Method | Path             | Auth? | Description                           |
| ------ | ---------------- | ----- | ------------------------------------- |
| POST   | `/auth/register` | No    | Register a new user (email, password) |
| POST   | `/auth/login`    | No    | Log in and get a JWT token            |
| POST   | `/medication`    | Yes   | Create one medication                 |

> **PS: Why a limit?** To prevent abuse: allowing a very large list in one request could slow down or crash the API, so bulk create is capped at 10 medications per request.

| POST | `/medications` | Yes | Create up to 10 medications at once |
| GET | `/medication/count` | No | Get total number of medications |
| GET | `/medication/search/:name` | No | Get one medication by name |
| DELETE | `/medication/:id` | Yes | Delete a medication by MongoDB `_id` |

---

## Status codes

- **200** – OK (e.g. login, search found, count)
- **201** – Created (register, create medication(s))
- **204** – No Content (successful delete)
- **400** – Bad Request (missing/invalid input, invalid id)
- **401** – Unauthorized (invalid/expired token, wrong login)
- **404** – Not Found (medication not found)
- **429** – Too Many Requests (e.g. more than 10 medications in one bulk create)
- **500** – Server Error (unexpected error)

---

## Project structure

- **`app.js`** – Express app, routes, auth middleware
- **`db.js`** – MongoDB connection and data functions
- **`medication-api.http`** – Example HTTP requests you can run in an editor (e.g. REST Client in VS Code)

---

## Database

- **MongoDB** database name: `medication-interaction`
- Collections: `medication`, `users`

Ensure MongoDB is running locally before starting the API.
