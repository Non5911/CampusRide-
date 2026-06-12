import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🛺</span>
        <span className="brand-name">CampusRide</span>
      </div>
      {user && (
        <div className="navbar-menu">
          {user.role === 'passenger' ? (
            <>
              <Link to="/home">Home</Link>
              <Link to="/history">My Rides</Link>
              <Link to="/scheduled">Scheduled</Link>
              <Link to="/profile">Profile</Link>
            </>
          ) : (
            <>
              <Link to="/driver">Dashboard</Link>
              <Link to="/history">Ride History</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;