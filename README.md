# CampusRide

## Project Overview
CampusRide is a full-stack ride-sharing platform designed for campus mobility. It enables passengers to request rides and drivers to accept and manage them in real time. The app also supports ride history, scheduling, profiles, and live updates.

## Technology Stack

### Frontend
- React.js
- React Router
- Axios
- Socket.IO Client
- Leaflet / React-Leaflet
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO
- bcryptjs

## Setup Instructions

### 1. Prerequisites
Install the following:
- Node.js
- npm
- MongoDB or a MongoDB Atlas connection

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file inside the backend folder with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campusride
JWT_SECRET=campusride_super_secret_jwt_key_2024
JWT_EXPIRE=7d
```
Start the backend:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Running the Application
- Backend runs at: http://localhost:5000
- Frontend runs at: http://localhost:3000

Make sure the backend is running before using the frontend features that depend on API calls.

## Feature List
- User registration and login: Users can create accounts, sign in securely, and access role-based features based on whether they are passengers or drivers.
- Passenger ride request flow: Passengers can request rides by providing trip details and selecting pickup or destination information.
- Driver availability and ride acceptance: Drivers can mark themselves available or unavailable and accept incoming ride requests from passengers.
- Real-time ride status updates using Socket.IO: Ride changes such as request received, accepted, in progress, completed, or cancelled are pushed instantly to connected users.
- Ride scheduling and ride history: Users can view planned rides and access a history of completed or cancelled rides for reference.
- Driver analytics and statistics: Drivers can monitor their activity, performance, and overall ride-related data through dedicated analytics views.
- Profile management: Users can update personal information and manage their account profile details.
- Rating and feedback system: Passengers can rate completed rides and provide feedback, helping improve service quality and trust.

## Authors
Chirag, Pratibha Kumari