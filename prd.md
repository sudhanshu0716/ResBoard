# Resource Management Dashboard

## Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB

---

## User Roles
### Admin
- Full CRUD access for Testers and VMs
- Can edit **all fields** (including Name & IP)
- Manage user accounts

### User
- Register with **username + password + passkey**
  - Passkey must equal `"nitest"`
- View dashboard with resource statistics
- Take or release resources
- Update resource details (except Name & IP)
- Cannot delete resources

---

## Authentication
- **Registration Form:** Username, Password, Passkey (`nitest`)
- **Login Form:** Username + Password
- **Session Management:** JWT-based authentication

---

## Dashboard Features
### Main Screen
- Resource Summary Table:
  | Metric | Count |
  |--------|-------|
  | Total Resources | X |
  | Resources in Use | Y |
  | Free Resources | Z |
  | Resources under Maintenance | W |

### Testers Menu
- Tabular view with columns:
  | Name | IP Address | Controller | OS | State | Used By | Released By | Taken At | Released At | Purpose |
- User Actions: Take, Release, Update (except Name/IP)
- Admin Actions: Full edit, Set Maintenance, Delete
- Search bar for filtering testers by Name, IP, Controller, OS, or User

### VM Menu
- Same tabular structure as Testers
- Same rules for user vs admin actions

---

## Resource States
- **FREE** → Available
- **IN-USE** → Taken by a user
- **MAINTENANCE** → Locked by admin

---

## UI/UX Requirements
- Clean, modern dashboard layout
- Responsive design (desktop + mobile)
- **Animations:**
  - Smooth tab transitions (Overview, Testers, VMs)
  - Fade-in effect for tables
  - Button hover animations (color shift, scale-up)
  - Modal pop-ups with slide/fade animations
  - Animated color transitions for resource state changes

---

## File Structure
project-root/
│
├── frontend/        # React + Vite
│   ├── src/
│   │   ├── components/   # Tables, Forms, Modals
│   │   ├── pages/        # Dashboard, Login, Register
│   │   ├── services/     # API calls
│   │   └── App.jsx
│   └── package.json
│
├── backend/         # Node.js + Express + MongoDB
│   ├── models/      # User, Resource schemas
│   ├── routes/      # API endpoints
│   ├── controllers/ # Business logic
│   ├── middleware/  # Auth, validation
│   └── server.js
│
├── run.bat          # Batch file to run frontend + backend
└── README.md


---

## Key Functional Requirements
- User Registration/Login with passkey validation (`nitest`)
- Dashboard statistics for resources
- Tabular resource management (Testers & VMs)
- Search & filter functionality
- Role-based access control (Admin vs User)
- Resource locking (only one user can take a resource at a time)
- Release flow (user can release resource)
- Animated UI for better UX

---

## Non-Functional Requirements
- Scalability: Handle multiple concurrent users
- Security: JWT authentication, password hashing, passkey validation
- Performance: Fast resource updates via MongoDB
- UI/UX: Animated, responsive, intuitive design

---

## Batch File (`run.bat`)
This file allows running both **frontend** and **backend** servers in one click.

```bat
@echo off
echo Starting Resource Management Dashboard...

:: Navigate to backend and start server
cd backend
start cmd /k "npm install && npm run dev"

:: Navigate to frontend and start Vite
cd ../frontend
start cmd /k "npm install && npm run dev"

echo Both frontend and backend are running.
pause
