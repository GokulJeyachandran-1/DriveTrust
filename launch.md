---
description: How to set up and run the DriveTrust DFM application
---

## 1. Database Setup (PostgreSQL)
Ensure you have PostgreSQL installed and running on your system.

1. Open your PostgreSQL client (like pgAdmin or psql).
2. Create a new database named `drivetrust`.
   ```sql
   CREATE DATABASE drivetrust;
   node prisma/seed.js
   ```
3. Your connection string in `backend/.env` is already set to `postgresql://postgres:postgres@localhost:5432/drivetrust`. Change the username/password if they differ.

## 2. Backend Initialization
Open a terminal in the project root:

1. Navigate to the backend:
   ```powershell
   cd backend
   ```
2. Install dependencies (if not already done):
   ```powershell
   npm install
   ```
3. Push the schema to your new database:
   // turbo
   ```powershell
   npx prisma db push
   ```
4. Start the backend in development mode:
   // turbo
   ```powershell
   npm run dev
   ```

## 3. Frontend Initialization
Open a new terminal in the project root:

1. Navigate to the frontend:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite dev server:
   // turbo
   ```powershell
   npm run dev
   ```

## 4. Access the Application
- The frontend will be running at [http://localhost:5173](http://localhost:5173)
- The backend API is at [http://localhost:5000/api](http://localhost:5000/api)
