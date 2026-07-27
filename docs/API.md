# Hackathon Management System - REST API Documentation

All API requests require `Content-Type: application/json` and, where specified, a token passed in the Authorization header as `Bearer <token>` or as an HTTP-only cookie.

---

## 🔐 Authentication APIs

### 1. Register User
* **Endpoint**: `/api/auth/register`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "Participant"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "user": {
      "id": "60d000000000000000000001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "Participant"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2. Login User
* **Endpoint**: `/api/auth/login`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": "60d000000000000000000001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "Participant"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 3. Logout User
* **Endpoint**: `/api/auth/logout`
* **Method**: `POST`
* **Auth Required**: No
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 4. Get Current User Profile
* **Endpoint**: `/api/auth/me`
* **Method**: `GET`
* **Auth Required**: Yes
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "60d000000000000000000001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "Participant",
      "isBlocked": false,
      "createdAt": "2026-07-27T03:56:38.000Z"
    }
  }
  ```

---

## 👥 Admin-Only User Management

### 1. Get All Users
* **Endpoint**: `/api/users`
* **Method**: `GET`
* **Auth Required**: Yes (Admin only)
* **Query Parameters**:
  - `search`: Filter by name/email (case-insensitive, partial).
  - `role`: Filter by role (`Admin`, `Organizer`, `Participant`, `Judge`).
  - `isBlocked`: Filter by account status (`true`/`false`).
  - `page`: Page index (default: `1`).
  - `limit`: Number of users per page (default: `10`).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "page": 1,
    "totalPages": 2,
    "totalRecords": 15,
    "users": [
      {
        "id": "60d000000000000000000001",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "Participant",
        "isBlocked": false
      }
    ]
  }
  ```

### 2. Toggle Block User Status
* **Endpoint**: `/api/users/:userId/block`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User Jane Doe has been blocked successfully",
    "user": {
      "id": "60d000000000000000000001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "Participant",
      "isBlocked": true
    }
  }
  ```

---

## 🏆 Hackathon APIs

### 1. Get All Hackathons
* **Endpoint**: `/api/hackathons`
* **Method**: `GET`
* **Auth Required**: Yes
* **Query Parameters**:
  - `search`: Searches name/theme.
  - `mode`: Format filter (`Online`/`Offline`).
  - `status`: Campaign state (`Upcoming`, `Registration Open`, `Ongoing`, `Completed`).
  - `sort`: Order by (`latest`, `oldest`, `alphabetical`, `registrationDeadline`, `prizePool`).
  - `page`: Page index.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "page": 1,
    "totalPages": 3,
    "totalRecords": 14,
    "hackathons": [
      {
        "_id": "60d000000000000000000101",
        "title": "Global AI Hackathon",
        "theme": "Artificial Intelligence",
        "mode": "Online",
        "startDate": "2026-08-01T00:00:00.000Z",
        "status": "Registration Open"
      }
    ]
  }
  ```

### 2. Create Hackathon
* **Endpoint**: `/api/hackathons`
* **Method**: `POST`
* **Auth Required**: Yes (Organizer only)
* **Request Body**:
  ```json
  {
    "title": "Global AI Hackathon",
    "theme": "Artificial Intelligence",
    "mode": "Online",
    "startDate": "2026-08-01T09:00:00Z",
    "endDate": "2026-08-03T18:00:00Z",
    "registrationDeadline": "2026-07-30T23:59:00Z",
    "maxTeamSize": 4,
    "prizePool": 10000,
    "description": "Building next gen AI tools"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Hackathon created successfully",
    "hackathon": {
      "_id": "60d000000000000000000101",
      "title": "Global AI Hackathon",
      "createdBy": "60d000000000000000000009"
    }
  }
  ```

---

## 📝 Registration APIs

### 1. Register for Hackathon
* **Endpoint**: `/api/registrations/:hackathonId`
* **Method**: `POST`
* **Auth Required**: Yes (Participant only)
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration submitted successfully",
    "status": "Pending"
  }
  ```

### 2. Approve/Reject Registration
* **Endpoint**: `/api/registrations/:registrationId/status`
* **Method**: `PUT`
* **Auth Required**: Yes (Organizer owner only)
* **Request Body**:
  ```json
  {
    "status": "Approved",
    "remarks": "Welcome aboard!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Registration approved"
  }
  ```

---

## 👥 Team APIs

### 1. Create a Team
* **Endpoint**: `/api/teams`
* **Method**: `POST`
* **Auth Required**: Yes (Participant only)
* **Request Body**:
  ```json
  {
    "teamName": "Byte Busters",
    "hackathon": "60d000000000000000000101"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Team created successfully",
    "team": {
      "_id": "60d000000000000000000201",
      "teamName": "Byte Busters",
      "inviteCode": "JOIN-AB12CD",
      "status": "Active"
    }
  }
  ```

### 2. Join a Team
* **Endpoint**: `/api/teams/join`
* **Method**: `POST`
* **Auth Required**: Yes (Participant only)
* **Request Body**:
  ```json
  {
    "inviteCode": "JOIN-AB12CD"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Joined team successfully"
  }
  ```

---

## 📂 Submission APIs

### 1. Submit Project Solution
* **Endpoint**: `/api/submissions`
* **Method**: `POST`
* **Auth Required**: Yes (Team Leader only)
* **Request Body**:
  ```json
  {
    "projectName": "MedScribe AI",
    "problemStatement": "Clinical report parsing takes too long.",
    "solution": "LLM parsing wrapper that extracts JSON structures.",
    "githubRepository": "https://github.com/user/medscribe-ai",
    "techStack": "React, Express, PyTorch",
    "liveDemo": "https://medscribe.onrender.com"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Project submitted successfully",
    "submission": {
      "_id": "60d000000000000000000301",
      "projectName": "MedScribe AI",
      "status": "Pending"
    }
  }
  ```

### 2. Update Submission Status
* **Endpoint**: `/api/submissions/:submissionId/status`
* **Method**: `PUT`
* **Auth Required**: Yes (Organizer creator, Admin only)
* **Request Body**:
  ```json
  {
    "status": "Approved"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Submission status updated to \"Approved\" successfully"
  }
  ```

---

## ⚖️ Judge Evaluation Reviews

### 1. Submit Project Review Scorecard
* **Endpoint**: `/api/reviews`
* **Method**: `POST`
* **Auth Required**: Yes (Judge only)
* **Request Body**:
  ```json
  {
    "submissionId": "60d000000000000000000301",
    "innovation": 8,
    "technicalComplexity": 9,
    "userInterface": 7,
    "functionality": 8,
    "scalability": 9,
    "documentation": 8,
    "presentation": 8,
    "feedback": "Outstanding architectural layout, scalable DB model.",
    "status": "Completed"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Evaluation review submitted successfully"
  }
  ```

---

## 🥇 Leaderboard calculation

### 1. Generate Leaderboard Results
* **Endpoint**: `/api/leaderboard/:hackathonId/generate`
* **Method**: `POST`
* **Auth Required**: Yes (Organizer creator, Admin only)
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Leaderboard generated successfully",
    "leaderboard": [
      {
        "rank": 1,
        "team": "Byte Busters",
        "project": "MedScribe AI",
        "score": 57.0,
        "position": "1st Place"
      }
    ]
  }
  ```

### 2. Fetch Leaderboard Ranks
* **Endpoint**: `/api/leaderboard/:hackathonId`
* **Method**: `GET`
* **Auth Required**: Yes
* **Query Parameters**:
  - `filter`: Filter by Winners (`Winners`) or top 10 ranked teams (`Top10`).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "leaderboard": [
      {
        "rank": 1,
        "team": "Byte Busters",
        "project": "MedScribe AI",
        "score": 57.0,
        "position": "1st Place"
      }
    ]
  }
  ```

---

## 📊 Dashboard APIs

### 1. Admin Dashboard Stats
* **Endpoint**: `/api/dashboard/admin`
* **Method**: `GET`
* **Auth Required**: Yes (Admin only)

### 2. Organizer Dashboard Stats
* **Endpoint**: `/api/dashboard/organizer`
* **Method**: `GET`
* **Auth Required**: Yes (Organizer only)

### 3. Participant Dashboard Stats
* **Endpoint**: `/api/dashboard/participant`
* **Method**: `GET`
* **Auth Required**: Yes (Participant only)

### 4. Judge Dashboard Stats
* **Endpoint**: `/api/dashboard/judge`
* **Method**: `GET`
* **Auth Required**: Yes (Judge only)
