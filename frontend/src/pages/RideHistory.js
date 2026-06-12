import React, { useState, useEffect } from 'react';
import { getRideHistory } from '../services/api';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getRideHistory()
      .then((res) => setRides(res.data.rides))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? rides : rides.filter((r) => r.status === filter);

  const statusColor = {
    completed: '#10b981', cancelled: '#ef4444',
    inprogress: '#8b5cf6', accepted: '#3b82f6', requested: '#f59e0b',
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Ride History</h1>
        <div className="filter-tabs">
          {['all', 'completed', 'cancelled', 'requested'].map((f) => (
            <button key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-icon">📋</span>
          <h3>No rides found</h3>
        </div>
      ) : (
        <div className="rides-grid">
          {filtered.map((ride) => (
            <div key={ride._id} className="ride-history-card card">
              <div className="ride-history-header">
                <span className="status-badge" style={{ background: statusColor[ride.status] }}>
                  {ride.status}
                </span>
                <span className="ride-date">
                  {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="ride-route">
                <div className="route-point">
                  <span className="dot pickup-dot"></span>
                  <span>{ride.pickupLocation.name}</span>
                </div>
                <div className="route-line"></div>
                <div className="route-point">
                  <span className="dot drop-dot"></span>
                  <span>{ride.dropLocation.name}</span>
                </div>
              </div>
              <div className="ride-meta">
                <span>💰 ₹{ride.fare}</span>
                <span>📏 {ride.distance} km</span>
                <span>💳 {ride.paymentMethod}</span>
                {ride.rating && <span>⭐ {ride.rating}/5</span>}
              </div>
              {ride.driver && (
                <div className="ride-person-info">
                  <span>🛺 Driver: {ride.driver.name}</span>
                </div>
              )}
              {ride.passenger && (
                <div className="ride-person-info">
                  <span>👤 Passenger: {ride.passenger.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RideHistory;