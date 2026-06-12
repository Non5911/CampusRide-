import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleNumber: user?.vehicleInfo?.vehicleNumber || '',
    vehicleType: user?.vehicleInfo?.vehicleType || 'E-Rickshaw',
    capacity: user?.vehicleInfo?.capacity || 3,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name, phone: form.phone,
        ...(user.role === 'driver' && {
          vehicleInfo: {
            vehicleNumber: form.vehicleNumber,
            vehicleType: form.vehicleType,
            capacity: form.capacity,
          },
        }),
      };
      const res = await updateProfile(payload);
      setUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header"><h1>👤 Profile</h1></div>
      <div className="profile-layout">
        <div className="profile-card card">
          <div className="profile-avatar">
            {user?.role === 'driver' ? '🛺' : '🧑'}
          </div>
          <h2>{user?.name}</h2>
          <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          <div className="profile-stats">
            <div><strong>{user?.totalRides || 0}</strong><span>Rides</span></div>
            <div><strong>{user?.averageRating || 'N/A'}</strong><span>Rating</span></div>
          </div>
        </div>
        <div className="card profile-form-card">
          <h2>Edit Profile</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={user?.email} disabled />
            </div>
            {user?.role === 'driver' && (
              <>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input type="text" value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
              </>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;