import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PassengerHome from './pages/PassengerHome';
import DriverHome from './pages/DriverHome';
import RideHistory from './pages/RideHistory';
import ScheduledRides from './pages/ScheduledRides';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={
              <ProtectedRoute role="passenger"><PassengerHome /></ProtectedRoute>
            } />
            <Route path="/driver" element={
              <ProtectedRoute role="driver"><DriverHome /></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><RideHistory /></ProtectedRoute>
            } />
            <Route path="/scheduled" element={
              <ProtectedRoute role="passenger"><ScheduledRides /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;