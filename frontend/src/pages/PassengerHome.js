import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { requestRide, getAvailableDrivers, getActiveRide, cancelRide, rateRide } from '../services/api';
import MapComponent from '../components/MapComponent';
import toast from 'react-hot-toast';

const CAMPUS_LOCATIONS = [
  { name: 'Main Gate', lat: 29.8631, lng: 77.8958 },
  { name: 'Convocation Hall', lat: 29.8668, lng: 77.8963 },
  { name: 'Library', lat: 29.8655, lng: 77.8971 },
  { name: 'IIT Hospital', lat: 29.8690, lng: 77.8940 },
  { name: 'Rajendra Bhawan', lat: 29.8645, lng: 77.8982 },
  { name: 'Cautley Bhawan', lat: 29.8672, lng: 77.8955 },
  { name: 'Ganga Bhawan', lat: 29.8660, lng: 77.8990 },
  { name: 'Sports Ground', lat: 29.8700, lng: 77.8950 },
  { name: 'New SAC', lat: 29.8635, lng: 77.8975 },
  { name: 'Thomso Ground', lat: 29.8680, lng: 77.8935 },
];

const PassengerHome = () => {
  const { socket } = useSocket();
  const [drivers, setDrivers] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [driversRes, activeRes] = await Promise.all([
        getAvailableDrivers(), getActiveRide()
      ]);
      setDrivers(driversRes.data.drivers);
      setActiveRide(activeRes.data.ride);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('yourRideAccepted', (ride) => {
      setActiveRide(ride);
      toast.success('🎉 Driver accepted your ride!');
    });
    socket.on('rideStatusUpdated', (ride) => {
      setActiveRide(ride);
      if (ride.status === 'inprogress') toast.success('🚗 Your ride has started!');
      if (ride.status === 'completed') {
        toast.success('✅ Ride completed!');
        setShowPayment(true);
      }
    });
    socket.on('driverAvailabilityChanged', fetchData);
    return () => {
      socket.off('yourRideAccepted');
      socket.off('rideStatusUpdated');
      socket.off('driverAvailabilityChanged');
    };
  }, [socket, fetchData]);

  const getLocationByName = (name) =>
    CAMPUS_LOCATIONS.find((l) => l.name === name);

  const calculateDistanceKm = (coords1, coords2) => {
    const R = 6371;
    const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
    const dLon = (coords2.lng - coords1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1.lat * (Math.PI / 180)) *
        Math.cos(coords2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const getEstimatedFare = (pickupName, dropName) => {
    const pickupLoc = getLocationByName(pickupName);
    const dropLoc = getLocationByName(dropName);
    if (!pickupLoc || !dropLoc) return { distance: 0, fare: 10 };

    const distance = calculateDistanceKm(
      { lat: pickupLoc.lat, lng: pickupLoc.lng },
      { lat: dropLoc.lat, lng: dropLoc.lng }
    );
    return { distance, fare: 10 };
  };

  const routePreview = pickup && drop
    ? (() => {
        const pickupLoc = getLocationByName(pickup);
        const dropLoc = getLocationByName(drop);
        if (!pickupLoc || !dropLoc) return [];
        return [[pickupLoc.lat, pickupLoc.lng], [dropLoc.lat, dropLoc.lng]];
      })()
    : [];

  const { distance: estimatedDistance, fare: estimatedFare } = getEstimatedFare(pickup, drop);

  const handleRequestRide = async () => {
    if (!pickup || !drop) return toast.error('Please select pickup and drop locations');
    if (pickup === drop) return toast.error('Pickup and drop cannot be same');
    setLoading(true);
    try {
      const pickupLoc = getLocationByName(pickup);
      const dropLoc = getLocationByName(drop);
      const res = await requestRide({
        pickupLocation: { name: pickup, coordinates: { lat: pickupLoc.lat, lng: pickupLoc.lng } },
        dropLocation: { name: drop, coordinates: { lat: dropLoc.lat, lng: dropLoc.lng } },
        paymentMethod,
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : null,
      });
      setActiveRide(res.data.ride);
      toast.success('Ride requested! Looking for drivers...');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      await cancelRide(activeRide._id);
      setActiveRide(null);
      toast.success('Ride cancelled');
    } catch (err) {
      toast.error('Failed to cancel ride');
    }
  };

  const handleRateRide = async () => {
    try {
      await rateRide(activeRide._id, { rating, feedback });
      toast.success('Thanks for your feedback!');
      setShowRating(false);
      setShowPayment(false);
      setActiveRide(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to submit rating');
    }
  };

  const handlePaymentDone = () => {
    setShowPayment(false);
    setShowRating(true);
  };

  const statusColors = {
    requested: '#f59e0b', accepted: '#3b82f6',
    inprogress: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444',
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🛺 Book a Ride</h1>
        <p>Available Drivers: <strong>{drivers.length}</strong></p>
      </div>

      <div className="passenger-layout">
        <div className="left-panel">
          {!activeRide ? (
            <div className="ride-form card">
              <h2>Request a Ride</h2>
              <div className="form-group">
                <label>📍 Pickup Location</label>
                <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
                  <option value="">Select pickup point</option>
                  {CAMPUS_LOCATIONS.map((l) => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>🏁 Drop Location</label>
                <select value={drop} onChange={(e) => setDrop(e.target.value)}>
                  <option value="">Select drop point</option>
                  {CAMPUS_LOCATIONS.map((l) => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>💳 Payment Method</label>
                <div className="payment-options">
                  <button type="button"
                    className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}>💵 Cash</button>
                  <button type="button"
                    className={`payment-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('upi')}>📱 UPI</button>
                </div>
              </div>
              <div className="form-group schedule-toggle">
                <label>
                  <input type="checkbox" checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)} />
                  Schedule for later
                </label>
              </div>
              {isScheduled && (
                <div className="form-group">
                  <label>📅 Schedule Time</label>
                  <input type="datetime-local" value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)} />
                </div>
              )}
              {pickup && drop && (
                <div className="fare-estimate">
                  <span>Estimated Fare</span>
                  <strong>₹{estimatedFare}</strong>
                  <small>{estimatedDistance} km • distance-based pricing</small>
                </div>
              )}
              <button className="btn-primary" onClick={handleRequestRide} disabled={loading}>
                {loading ? 'Requesting...' : '🛺 Request Ride'}
              </button>
            </div>
          ) : (
            <div className="active-ride card">
              <h2>Active Ride</h2>
              <div className="ride-status-badge" style={{ background: statusColors[activeRide.status] }}>
                {activeRide.status.toUpperCase()}
              </div>
              <div className="ride-details">
                <div className="ride-detail-item">
                  <span>📍 From</span>
                  <strong>{activeRide.pickupLocation.name}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>🏁 To</span>
                  <strong>{activeRide.dropLocation.name}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>💰 Fare</span>
                  <strong>₹{activeRide.fare}</strong>
                </div>
                <div className="ride-detail-item">
                  <span>📏 Distance</span>
                  <strong>{activeRide.distance} km</strong>
                </div>
              </div>
              {activeRide.driver && (
                <div className="driver-info-card">
                  <h3>Your Driver</h3>
                  <p><strong>{activeRide.driver.name}</strong></p>
                  <p>📞 {activeRide.driver.phone}</p>
                  <p>⭐ {activeRide.driver.averageRating || 'New Driver'}</p>
                  {activeRide.driver.vehicleInfo && (
                    <p>🛺 {activeRide.driver.vehicleInfo.vehicleNumber}</p>
                  )}
                </div>
              )}
              {activeRide.status === 'requested' && (
                <button className="btn-danger" onClick={handleCancelRide}>Cancel Ride</button>
              )}
            </div>
          )}

          {showPayment && (
            <div className="modal-overlay">
              <div className="modal card">
                <h2>💳 Payment</h2>
                <div className="payment-summary">
                  <p>Ride completed!</p>
                  <div className="fare-display">₹{activeRide?.fare || 0}</div>
                  {activeRide?.paymentMethod === 'upi' ? (
                    <div className="upi-payment">
                      <p>Scan QR to pay via UPI</p>
                      <div className="qr-placeholder">
                        <div className="qr-code">
                          <p>📱 UPI QR Code</p>
                          <p>campusride@upi</p>
                          <p className="qr-amount">₹{activeRide?.fare}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="cash-info">💵 Please pay cash to driver</p>
                  )}
                  <button className="btn-primary" onClick={handlePaymentDone}>
                    ✅ Payment Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRating && (
            <div className="modal-overlay">
              <div className="modal card">
                <h2>⭐ Rate Your Ride</h2>
                <p>How was your experience?</p>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button"
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}>★</button>
                  ))}
                </div>
                <div className="form-group">
                  <label>Feedback (optional)</label>
                  <textarea placeholder="Share your experience..."
                    value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
                </div>
                <button className="btn-primary" onClick={handleRateRide}>Submit Rating</button>
              </div>
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="card">
            <h2>🗺️ Live Map</h2>
            <MapComponent
              drivers={drivers}
              activeRide={activeRide}
              routePreview={routePreview}
              userLocation={{ lat: 29.8668, lng: 77.8963 }}
              height="500px"
            />
          </div>
          <div className="card drivers-list">
            <h2>Available Drivers ({drivers.length})</h2>
            {drivers.length === 0 ? (
              <p className="no-data">No drivers available right now</p>
            ) : (
              drivers.map((driver) => (
                <div key={driver._id} className="driver-card">
                  <div className="driver-avatar">🛺</div>
                  <div className="driver-details">
                    <strong>{driver.name}</strong>
                    <span>⭐ {driver.averageRating || 'New'} • {driver.totalRides} rides</span>
                    <span>{driver.vehicleInfo?.vehicleType} • {driver.vehicleInfo?.vehicleNumber}</span>
                  </div>
                  <div className="online-dot"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerHome;