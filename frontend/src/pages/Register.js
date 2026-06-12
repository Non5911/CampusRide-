import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'passenger',
    vehicleNumber: '', vehicleType: 'E-Rickshaw', capacity: 3,
  });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email,
        password: form.password, phone: form.phone, role: form.role,
        ...(form.role === 'driver' && {
          vehicleInfo: {
            vehicleNumber: form.vehicleNumber,
            vehicleType: form.vehicleType,
            capacity: form.capacity,
          },
        }),
      };
      const res = await register(payload);
      loginUser(res.data.token, res.data.user);
      toast.success('Account created successfully!');
      navigate(res.data.user.role === 'driver' ? '/driver' : '/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-logo">🛺</span>
          <h1>CampusRide</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-selector">
            <button type="button"
              className={`role-btn ${form.role === 'passenger' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'passenger' })}>
              🧑 Passenger
            </button>
            <button type="button"
              className={`role-btn ${form.role === 'driver' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: 'driver' })}>
              🛺 Driver
            </button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Create password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {form.role === 'driver' && (
            <div className="driver-fields">
              <h3>Vehicle Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input type="text" placeholder="e.g. UK07-1234"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" min="1" max="10"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;