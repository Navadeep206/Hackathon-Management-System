# Hackathon Management System (MERN Stack)

A premium, production-ready Full-Stack Hackathon Management System built using the MERN architecture. It streamlines hackathon operations—from participant registrations and team assembly to project submissions, judge evaluations, and automated leaderboard generation.

---

## 🚀 Key Features

* **Role-Based Workspace Dashboards**:
  - **Admin**: Monitor metrics, query/block system users, and audit campaigns.
  - **Organizer**: Create hackathons, review registrations, coordinate teams, grade submissions, and calculate leaderboards.
  - **Participant**: Sign up for hackathons, assemble/disband teams, invite members, and submit solution portals.
  - **Judge**: View assigned submissions and slide criteria points (1-10) to generate scorecard evaluations.
* **Global Search & Filter Panels**:
  - Search hackathons, teams, submissions, and users with partial case-insensitive MongoDB queries.
  - Filters: Mode (Online/Offline), Status (Upcoming, Registration Open, Completed, Ongoing), and Score.
* **Automated Leaderboard generation**:
  - Scores are calculated as the average of judge criteria reviews.
  - Generates podium winners and top 10 rankings.
* **Security & Form Validations**:
  - Full-strength password checks, GitHub url matches, duplicate emails, and role checks on both client and server sides.

---

## 🛠️ Technology Stack

* **Frontend**: React (v19), React Router (v7), React Icons, Tailwind CSS (v4), Axios, Vite (v8)
* **Backend**: Node.js, Express, Mongoose, MongoDB Atlas, bcrypt, jsonwebtoken, multer, cookie-parser
* **Tooling & Lint**: oxlint, nodemon

---

## 📁 Folder Structure

```text
├── client/                     # Frontend Vite + React SPA
│   ├── src/
│   │   ├── components/         # Reusable dashboard cards & UI elements
│   │   │   └── common/         # Common UI: SearchBar, Filters, Pagination, Modals, Loader, Toasts
│   │   ├── pages/              # Auth & Role-based Dashboard Pages
│   │   ├── services/           # Centralized API client (api.js)
│   │   ├── App.jsx             # React routing setup
│   │   └── index.css           # Tailwind v4 import
│   ├── index.html
│   └── package.json
│
├── server/                     # Backend Node.js REST API
│   ├── config/                 # DB connectors
│   ├── controllers/            # Controller logic (Auth, Hackathons, Teams, Submissions, Reviews)
│   ├── middleware/             # Protected auth rules & global error hooks
│   ├── models/                 # Mongoose schemas (User, Hackathon, Team, Registration, Submission, Review, Leaderboard)
│   ├── routes/                 # Express API routes
│   └── server.js               # Entry point (port 5099)
│
└── docs/                       # Project Documentation Assets
    ├── API.md                  # Comprehensive REST API specifications
    ├── DatabaseSchema.md       # Collections schemas and ER Diagrams
    └── ProjectReport.md        # Technical Project Report
```

---

## ⚙️ Installation & Setup

### 1. Database Setup
1. Create a cluster on **MongoDB Atlas**.
2. Retrieve the Mongo connection string URI.

### 2. Backend Config
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure variables:
   ```env
   PORT=5099
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Run the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Config
1. Navigate to the `client/` directory:
   ```bash
   cd ../client
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the frontend Vite server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---

## 📦 Production Deployment

### 1. Deployed Coordinates
* **Frontend SPA**: [Vercel Deployment Link](https://hackathon-management-system-client.vercel.app) (Placeholder)
* **Backend API**: [Render Service Link](https://hackathon-management-system-api.onrender.com) (Placeholder)
* **Atlas Database**: Cloud MongoDB Instance

### 2. Environment Variables Configuration

| Variable | Place | Production Value |
| :--- | :--- | :--- |
| `PORT` | Server | `5099` |
| `MONGO_URI` | Server | Deployed Atlas connection link |
| `JWT_SECRET` | Server | Strong cryptographic key string |
| `CLIENT_URL` | Server | `https://hackathon-management-system-client.vercel.app` |
| `NODE_ENV` | Server | `production` |

---

## 📄 License
This project is open-source and licensed under the MIT License.
