import React, { useState, useEffect } from 'react';
import { getScheduledRides, cancelRide } from '../services/api';
import toast from 'react-hot-toast';

const ScheduledRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScheduledRides()
      .then((res) => setRides(res.data.rides))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    try {
      await cancelRide(id);
      setRides((prev) => prev.filter((r) => r._id !== id));
      toast.success('Scheduled ride cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📅 Scheduled Rides</h1>
      </div>
      {rides.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-icon">📅</span>
          <h3>No scheduled rides</h3>
          <p>Schedule a ride from the home page</p>
        </div>
      ) : (
        <div className="rides-grid">
          {rides.map((ride) => (
            <div key={ride._id} className="card">
              <div className="scheduled-time">
                📅 {new Date(ride.scheduledTime).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
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
              </div>
              <button className="btn-danger" onClick={() => handleCancel(ride._id)}>
                Cancel Scheduled Ride
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledRides;