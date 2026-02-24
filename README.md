# ResBoard - Resource Management Dashboard

ResBoard is a full-stack web application designed to track, manage, and provision engineering resources such as Virtual Machines (VMs) and hardware Testers. Built with a modern aesthetic, it features a glassmorphic UI, real-time analytics, and role-based access control.

## 🚀 Features

*   **Premium UI/UX:** Clean, modern interface with glassmorphism, animated gradients, and full Light/Dark mode support.
*   **Role-Based Access Control (RBAC):** Distinct `Admin` and `User` roles.
    *   **Users** can view resources, take ownership of them for a specified duration, and submit *Resource Requests* for new ones.
    *   **Admins** have full CRUD capabilities, can enforce Maintenance states, delete inactive users, and approve/reject Resource Requests.
*   **Dynamic Resource Tracking:** Track who is using a resource, for what purpose, and for how long. Resources automatically release when their timer expires.
*   **Approval Workflow:** Users can submit formal requests for new VMs/Testers. Admins review these requests in the Admin Logs panel and can instantly provision them with a single click.
*   **Live Analytics & Logs:** Admins have access to a dashboard displaying real-time utilization graphs, most active users, and a comprehensive master audit log of all system actions.
*   **Smart Notifications:** Context-aware alerts for urgent resource requests and admin approvals.

## 🛠️ Technology Stack

*   **Frontend:** React 18, Vite, React Router DOM, Framer Motion (for animations), Lucide React (for iconography). Vanilla CSS for sophisticated styling.
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB with Mongoose ODN.
*   **Authentication:** JSON Web Tokens (JWT) & bcrypt for secure password hashing.

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB running locally or a MongoDB Atlas URI.

### 1. Clone & Install Dependencies
Navigate to both the `backend` and `frontend` directories to install their respective packages.

```bash
# Terminal 1: Setup Backend
cd backend
npm install

# Terminal 2: Setup Frontend
cd frontend
npm install
```

### 2. Environment Variables
In the `backend` directory, create a `.env` file with your configuration:
```env
PORT=5005
MONGO_URI=mongodb://127.0.0.1:27017/resboard
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Running the Application
A convenient `run.bat` file is provided in the root directory to launch both the frontend and backend simultaneously on Windows.

```cmd
# Double click run.bat, or run it from the terminal:
.\run.bat
```

Alternatively, you can run them manually:
*   **Backend:** `cd backend && node server.js` (runs on `http://localhost:5005`)
*   **Frontend:** `cd frontend && npm run dev` (runs on `http://localhost:5173`)

## 🔐 Initial Login & Demo

By default, any new user can register. To restrict access to authorized personnel, the registration screen requires a passkey.
*   **Registration Passkey:** `nitest`

To become an **Admin**, you have two options:
1.  Register a user normally, open your local MongoDB client (e.g. MongoDB Compass), find the created user in the `resboard.users` collection, and change their `role` from `User` to `Admin`.
2.  Use the initial seed admin if deployed through an automated initializer.

## 📝 License
This project is proprietary and intended for internal resource management.
