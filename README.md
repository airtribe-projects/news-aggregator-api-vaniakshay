[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=24305711&assignment_repo_type=AssignmentRepo)


# News Aggregator API

A RESTful API for a personalized news aggregator built with **Node.js, Express.js, MongoDB, Mongoose, bcrypt, JWT, and NewsAPI**.

The API provides user authentication, secure password handling, JWT-based authorization, user preferences, and personalized news fetching.

## Features

* User registration
* Secure password hashing with bcrypt
* JWT-based authentication
* Login and logout
* Protected API routes
* Update user information
* Delete user account
* User news preferences
* NewsAPI integration
* Personalized news based on user preferences
* Dynamic news search
* Pagination support
* API versioning
* MongoDB Atlas integration
* Environment-based configuration
* Error handling

## Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **bcrypt**
* **jsonwebtoken**
* **Axios**
* **NewsAPI**
* **dotenv**

## Project Structure

```text
news-aggregator-api/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── news.controller.js
│   │
│   ├── middleware/
│   │   └── auth.middleware.js
│   │
│   ├── models/
│   │   └── user.model.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── news.routes.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Navigate to the project:

```bash
cd news-aggregator-api
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

NEWS_API_URL=https://newsapi.org/v2/everything
NEWS_API_KEY=your_newsapi_key
```

### Important

Never commit your `.env` file to Git.

Add it to `.gitignore`:

```text
.env
node_modules/
```

## Running the Project

Start the development server with Nodemon:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

## API Endpoints

All endpoints are versioned under:

```text
/api/v1
```

### Authentication

| Method | Endpoint                | Authentication | Description         |
| ------ | ----------------------- | -------------- | ------------------- |
| POST   | `/api/v1/auth/register` | No             | Register a new user |
| POST   | `/api/v1/auth/login`    | No             | Login user          |
| POST   | `/api/v1/auth/logout`   | Yes            | Logout user         |
| PUT    | `/api/v1/auth/update`   | Yes            | Update user         |
| DELETE | `/api/v1/auth/delete`   | Yes            | Delete user         |

### News

| Method | Endpoint       | Authentication | Description             |
| ------ | -------------- | -------------- | ----------------------- |
| GET    | `/api/v1/news` | Yes            | Fetch personalized news |

## Authentication

Protected endpoints require a JWT.

Add the following header to your request:

```http
Authorization: Bearer <your-jwt-token>
```

For example:

```http
GET /api/v1/news?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Register

### Request

```http
POST /api/v1/auth/register
```

```json
{
  "name": "Akshay",
  "email": "akshay@example.com",
  "password": "Password@123"
}
```

### Response

```json
{
  "message": "User registered successfully",
  "token": "your-jwt-token",
  "user": {
    "id": "user-id",
    "name": "Akshay",
    "email": "akshay@example.com",
    "preferences": {
      "categories": []
    }
  }
}
```

The password is hashed using bcrypt before being stored in MongoDB.

## Login

### Request

```http
POST /api/v1/auth/login
```

```json
{
  "email": "akshay@example.com",
  "password": "Password@123"
}
```

The response contains a JWT that can be used to access protected endpoints.

## Fetch News

### Request

```http
GET /api/v1/news?page=1&limit=10
```

The endpoint uses the authenticated user's preferences to personalize the results.

You can also provide a custom search query:

```http
GET /api/v1/news?q=technology&page=1&limit=10
```

### Query Parameters

| Parameter | Description                 |
| --------- | --------------------------- |
| `q`       | Search query                |
| `page`    | Page number                 |
| `limit`   | Number of articles per page |

Example:

```text
/api/v1/news?q=artificial%20intelligence&page=1&limit=10
```

## Personalized News

Users can have news preferences such as:

```json
{
  "preferences": {
    "categories": [
      "technology",
      "business",
      "sports"
    ]
  }
}
```

When no `q` parameter is provided, the API uses the user's preferences to construct the NewsAPI search query.

For example:

```text
technology OR business OR sports
```

If the user has no preferences, the API fetches general news instead.

If the user provides `q`, the explicit search query takes priority over their preferences.

## Authentication Flow

```text
Register
   │
   ▼
Hash Password with bcrypt
   │
   ▼
Save User to MongoDB
   │
   ▼
Generate JWT
   │
   ▼
Return JWT
```

For protected requests:

```text
Client
  │
  │ Authorization: Bearer <JWT>
  ▼
Auth Middleware
  │
  │ jwt.verify()
  ▼
req.user
  │
  ▼
Protected Controller
```

## Database

MongoDB Atlas is used as the database provider.

The application uses Mongoose to interact with MongoDB.

### User Schema

```text
User
├── name
├── email
├── password
├── preferences
│   └── categories[]
├── createdAt
└── updatedAt
```

Passwords are stored as bcrypt hashes and are never stored as plain text.

## Error Handling

The API handles common errors including:

* Missing required fields
* Invalid credentials
* Duplicate email addresses
* Invalid or expired JWT
* User not found
* NewsAPI errors
* MongoDB connection errors

## Security

* Passwords are hashed using bcrypt.
* JWT is used for authentication.
* JWT secret is stored in environment variables.
* NewsAPI credentials are stored in environment variables.
* `.env` should not be committed to the repository.
* Protected endpoints require authentication.

## Future Improvements

Potential improvements include:

* Request validation using Joi/Zod/express-validator
* Refresh tokens
* JWT token revocation/blacklisting
* Rate limiting
* News caching with Redis
* Advanced news filtering
* Category-specific news endpoints
* Automated tests
* API documentation with Swagger/OpenAPI
* Better centralized error handling
* Improved logging

## License

This project is developed as part of a Backend Engineering Launchpad assignment.
