import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toggleAvailability, updateLocation, getDriverStats, getPendingRideRequests, acceptRide, updateRideStatus, cancelRide } from '../services/api';
import MapComponent from '../components/MapComponent';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

const DriverHome = () => {
  const { user, setUser } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDriverStats();
      setStats(res.data.stats);
      setActiveRide(res.data.stats.activeRide);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPendingRideRequests = useCallback(async () => {
    try {
      const res = await getPendingRideRequests();
      setRideRequests(res.data.rides || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchStats(); fetchPendingRideRequests(); }, [fetchStats, fetchPendingRideRequests]);

  useEffect(() => {
    if (!socket) return;
    socket.on('newRideRequest', (ride) => {
      setRideRequests((prev) => {
        if (prev.find((r) => r._id === ride._id)) return prev;
        return [ride, ...prev];
      });
      toast('🔔 New ride request!', { icon: '🛺' });
    });
    socket.on('rideCancelled', (ride) => {
      setRideRequests((prev) => prev.filter((r) => r._id !== ride._id));
      if (activeRide?._id === ride._id) {
        setActiveRide(null);
        toast.error('Passenger cancelled the ride');
      }
    });
    return () => {
      socket.off('newRideRequest');
      socket.off('rideCancelled');
    };
  }, [socket, user, activeRide]);

  const handleToggleAvailability = async () => {
    setLoading(true);
    try {
      const res = await toggleAvailability();
      setUser((prev) => ({ ...prev, isAvailable: res.data.isAvailable }));
      setStats((prev) => prev ? { ...prev, isAvailable: res.data.isAvailable } : prev);
      toast.success(res.data.message);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    } catch (err) {
      toast.error('Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      const res = await acceptRide(rideId);
      setActiveRide(res.data.ride);
      setRideRequests((prev) => prev.filter((r) => r._id !== rideId));
      toast.success('Ride accepted!');
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const res = await updateRideStatus(activeRide._id, status);
      setActiveRide(res.data.ride);
      if (status === 'completed') {
        toast.success('Ride completed! 🎉');
        fetchStats();
        setActiveRide(null);
      } else {
        toast.success(`Status updated to ${status}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleCancelRide = async () => {
    try {
      await cancelRide(activeRide._id);
      setActiveRide(null);
      toast.success('Ride cancelled');
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🛺 Driver Dashboard</h1>
        <button
          className={`availability-btn ${user?.isAvailable ? 'online' : 'offline'}`}
          onClick={handleToggleAvailability} disabled={loading}>
          {user?.isAvailable ? '🟢 Online' : '🔴 Offline'}
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🛺</span>
            <div><strong>{stats.totalRides}</strong><span>Total Rides</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <div><strong>{stats.todayRides}</strong><span>Today's Rides</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⭐</span>
            <div><strong>{stats.averageRating || 'N/A'}</strong><span>Rating</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div><strong>₹{stats.totalEarnings}</strong><span>Total Earnings</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div><strong>₹{stats.todayEarnings}</strong><span>Today's Earnings</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🌟</span>
            <div><strong>{stats.totalRatings}</strong><span>Total Ratings</span></div>
          </div>
        </div>
      )}

      <div className="driver-layout">
        <div className="left-panel">
          {activeRide ? (
            <div className="active-ride card">
              <h2>🚗 Active Ride</h2>
              <div className={`ride-status-badge status-${activeRide.status}`}>
                {activeRide.status.toUpperCase()}
              </div>
              <div className="ride-details">
                <div className="ride-detail-item">
                  <span>👤 Passenger</span>
                  <strong>{activeRide.passenger?.name}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>📞 Phone</span>
                  <strong>{activeRide.passenger?.phone}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>📍 Pickup</span>
                  <strong>{activeRide.pickupLocation.name}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>🏁 Drop</span>
                  <strong>{activeRide.dropLocation.name}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>💰 Fare</span>
                  <strong>₹{activeRide.fare}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>💳 Payment</span>
                  <strong>{activeRide.paymentMethod?.toUpperCase()}</strong>
                </div>
              </div>
              <div className="ride-actions">
                {activeRide.status === 'accepted' && (
                  <button className="btn-primary" onClick={() => handleUpdateStatus('inprogress')}>
                    ▶ Start Ride
                  </button>
                )}
                {activeRide.status === 'inprogress' && (
                  <button className="btn-success" onClick={() => handleUpdateStatus('completed')}>
                    ✅ Complete Ride
                  </button>
                )}
                {activeRide.status === 'accepted' && (
                  <button className="btn-danger" onClick={handleCancelRide}>Cancel</button>
                )}
              </div>
            </div>
          ) : rideRequests.length > 0 ? (
            <div className="card">
              <h2>🔔 Ride Requests ({rideRequests.length})</h2>
              {rideRequests.map((ride) => (
                <div key={ride._id} className="ride-request-card">
                  <div className="request-header">
                    <span>👤 {ride.passenger?.name}</span>
                    <span className="fare-tag">₹{ride.fare}</span>
                  </div>
                  <div className="request-route">
                    <span>📍 {ride.pickupLocation.name}</span>
                    <span className="route-arrow">→</span>
                    <span>🏁 {ride.dropLocation.name}</span>
                  </div>
                  <div className="request-meta">
                    <span>📏 {ride.distance} km</span>
                    <span>💳 {ride.paymentMethod}</span>
                  </div>
                  <div className="request-actions">
                    <button className="btn-success" onClick={() => handleAcceptRide(ride._id)}>
                      ✅ Accept
                    </button>
                    <button className="btn-danger"
                      onClick={() => setRideRequests((p) => p.filter((r) => r._id !== ride._id))}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <span className="empty-icon">🛺</span>
              <h3>{user?.isAvailable ? 'Waiting for ride requests...' : 'You are offline'}</h3>
              <p>{user?.isAvailable ? 'New requests will appear here' : 'Go online to receive ride requests'}</p>
            </div>
          )}

          {stats?.recentRides?.length > 0 && (
            <div className="card">
              <h2>Recent Rides</h2>
              {stats.recentRides.map((ride) => (
                <div key={ride._id} className="history-item">
                  <div>
                    <strong>{ride.passenger?.name}</strong>
                    <span>{ride.pickupLocation.name} → {ride.dropLocation.name}</span>
                  </div>
                  <strong>₹{ride.fare}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="card">
            <h2>🗺️ Campus Map</h2>
            <MapComponent
              activeRide={activeRide}
              userLocation={{ lat: 29.8668, lng: 77.8963 }}
              height="350px"
            />
          </div>

          {stats?.recentRides?.length > 0 && (
            <div className="card">
              <h2>📊 Earnings Overview</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.recentRides.slice(0, 7).map((r, i) => ({
                  name: `Ride ${i + 1}`, fare: r.fare
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Fare']} />
                  <Bar dataKey="fare" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats?.ratings?.length > 0 && (
            <div className="card">
              <h2>⭐ Recent Ratings</h2>
              {stats.ratings.map((r) => (
                <div key={r._id} className="rating-item">
                  <div>
                    <strong>{r.passenger?.name}</strong>
                    <span>{r.feedback || 'No feedback'}</span>
                  </div>
                  <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverHome;