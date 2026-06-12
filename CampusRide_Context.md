# CampusRide - Complete Project Context
## (Hand this file to any AI to continue the project)

---

## Project Overview
**Project Name:** CampusRide
**Type:** Real-Time Campus Mobility and Ride Management Platform
**Purpose:** Resume project for CSE placements
**Stack:** React + Node.js + Express + Socket.IO + MongoDB + JWT

---

## Problem Statement Summary
Build a real-time ride management platform for a campus environment (IIT Roorkee e-rickshaws).
- Passengers can request rides, track status in real-time
- Drivers can accept/reject rides, toggle availability
- Real-time updates using WebSockets (Socket.IO)
- Complete ride lifecycle: Requested → Accepted → In Progress → Completed → Cancelled
- Driver dashboard with stats and analytics
- Ratings & feedback system
- Live map integration (Leaflet + OpenStreetMap)
- Ride scheduling
- Simulated digital payments (UPI/QR)
- Demand analytics

---

## Current Status
✅ Backend - FULLY COMPLETE AND RUNNING
✅ Frontend - IMPLEMENTED IN WORKSPACE

---

## System Info
- OS: Windows
- Node.js: v24.16.0
- npm: 11.17.0
- MongoDB: Running locally on port 27017
- Backend running on: http://localhost:5000
- Frontend will run on: http://localhost:3000

---

## Project Folder Structure
```
CampusRide/
├── backend/          ✅ COMPLETE
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── rideController.js
│   │   └── driverController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Ride.js
│   │   └── Rating.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── rideRoutes.js
│   │   └── driverRoutes.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/         ❌ NOT STARTED
```

---

## Backend API Endpoints

### Auth Routes (/api/auth)
- POST /api/auth/register - Register user (passenger or driver)
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user (protected)
- PUT /api/auth/profile - Update profile (protected)

### Ride Routes (/api/rides)
- GET /api/rides/drivers/available - Get available drivers
- GET /api/rides/history - Get ride history
- GET /api/rides/active - Get active ride
- GET /api/rides/scheduled - Get scheduled rides (passenger only)
- GET /api/rides/all - Get all rides
- POST /api/rides/request - Request a ride (passenger only)
- PUT /api/rides/:id/accept - Accept ride (driver only)
- PUT /api/rides/:id/status - Update ride status
- PUT /api/rides/:id/cancel - Cancel ride
- POST /api/rides/:id/rate - Rate a ride (passenger only)

### Driver Routes (/api/driver)
- PUT /api/driver/availability - Toggle online/offline (driver only)
- PUT /api/driver/location - Update location (driver only)
- GET /api/driver/stats - Get driver statistics (driver only)
- GET /api/driver/analytics - Get driver analytics (driver only)

---

## Socket.IO Events

### Server Emits (Backend → Frontend)
- `newRideRequest` - New ride requested by passenger
- `rideAccepted` - Ride accepted by driver
- `yourRideAccepted` - Sent to specific passenger room
- `rideStatusUpdated` - Ride status changed
- `rideCancelled` - Ride cancelled
- `driverAvailabilityChanged` - Driver went online/offline
- `driverLocationUpdated` - Driver location updated

### Client Emits (Frontend → Backend)
- `joinRoom` - Join user's personal room (send userId)
- `driverLocationUpdate` - Driver sends location update

---

## Environment Variables (backend/.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campusride
JWT_SECRET=campusride_super_secret_jwt_key_2024
JWT_EXPIRE=7d
```

---

## Complete Backend Source Code

### backend/config/db.js
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### backend/models/User.js
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['passenger', 'driver'],
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    vehicleInfo: {
      vehicleNumber: String,
      vehicleType: String,
      capacity: Number,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### backend/models/Ride.js
```javascript
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pickupLocation: {
      name: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    dropLocation: {
      name: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'inprogress', 'completed', 'cancelled'],
      default: 'requested',
    },
    fare: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    scheduledTime: {
      type: Date,
      default: null,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi'],
      default: 'cash',
    },
    startTime: Date,
    endTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
```

### backend/models/Rating.js
```javascript
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rating', ratingSchema);
```

### backend/middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
```

### backend/controllers/authController.js
```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleInfo } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      vehicleInfo: role === 'driver' ? vehicleInfo : undefined,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleInfo: user.vehicleInfo,
        isAvailable: user.isAvailable,
        averageRating: user.averageRating,
        totalRides: user.totalRides,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleInfo: user.vehicleInfo,
        isAvailable: user.isAvailable,
        averageRating: user.averageRating,
        totalRides: user.totalRides,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, vehicleInfo } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, vehicleInfo },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### backend/controllers/rideController.js
```javascript
const Ride = require('../models/Ride');
const User = require('../models/User');
const Rating = require('../models/Rating');

exports.requestRide = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, scheduledTime, isScheduled, paymentMethod } = req.body;

    const fare = calculateFare(pickupLocation.coordinates, dropLocation.coordinates);
    const distance = calculateDistance(pickupLocation.coordinates, dropLocation.coordinates);

    const ride = await Ride.create({
      passenger: req.user.id,
      pickupLocation,
      dropLocation,
      fare,
      distance,
      scheduledTime: isScheduled ? scheduledTime : null,
      isScheduled: isScheduled || false,
      paymentMethod: paymentMethod || 'cash',
    });

    await ride.populate('passenger', 'name phone averageRating');
    req.io.emit('newRideRequest', ride);
    res.status(201).json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'requested')
      return res.status(400).json({ message: 'Ride is no longer available' });

    ride.driver = req.user.id;
    ride.status = 'accepted';
    await ride.save();
    await ride.populate('passenger driver', 'name phone averageRating vehicleInfo');

    req.io.emit('rideAccepted', ride);
    req.io.to(ride.passenger.toString()).emit('yourRideAccepted', ride);
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (status === 'inprogress') ride.startTime = new Date();
    if (status === 'completed') {
      ride.endTime = new Date();
      await User.findByIdAndUpdate(ride.driver, { $inc: { totalRides: 1 } });
    }

    ride.status = status;
    await ride.save();
    await ride.populate('passenger driver', 'name phone averageRating vehicleInfo');
    req.io.emit('rideStatusUpdated', ride);
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (['completed', 'cancelled'].includes(ride.status))
      return res.status(400).json({ message: 'Cannot cancel this ride' });

    ride.status = 'cancelled';
    await ride.save();
    req.io.emit('rideCancelled', ride);
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    const query = req.user.role === 'driver'
      ? { driver: req.user.id }
      : { passenger: req.user.id };

    const rides = await Ride.find(query)
      .populate('passenger driver', 'name phone averageRating')
      .sort({ createdAt: -1 });
    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveRide = async (req, res) => {
  try {
    const query = req.user.role === 'driver'
      ? { driver: req.user.id, status: { $in: ['accepted', 'inprogress'] } }
      : { passenger: req.user.id, status: { $in: ['requested', 'accepted', 'inprogress'] } };

    const ride = await Ride.findOne(query).populate(
      'passenger driver', 'name phone averageRating vehicleInfo'
    );
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateRide = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'completed')
      return res.status(400).json({ message: 'Can only rate completed rides' });
    if (ride.rating)
      return res.status(400).json({ message: 'Ride already rated' });

    ride.rating = rating;
    ride.feedback = feedback;
    await ride.save();

    await Rating.create({
      ride: ride._id,
      passenger: ride.passenger,
      driver: ride.driver,
      rating,
      feedback,
    });

    const driver = await User.findById(ride.driver);
    const totalRatings = driver.totalRatings + 1;
    const averageRating =
      (driver.averageRating * driver.totalRatings + rating) / totalRatings;

    await User.findByIdAndUpdate(ride.driver, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
    });

    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isAvailable: true }).select(
      'name phone averageRating vehicleInfo currentLocation totalRides'
    );
    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getScheduledRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      passenger: req.user.id,
      isScheduled: true,
      status: 'requested',
    }).populate('passenger driver', 'name phone');
    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('passenger driver', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateDistance = (coords1, coords2) => {
  const R = 6371;
  const dLat = deg2rad(coords2.lat - coords1.lat);
  const dLon = deg2rad(coords2.lng - coords1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coords1.lat)) *
      Math.cos(deg2rad(coords2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const calculateFare = (coords1, coords2) => {
  const distance = calculateDistance(coords1, coords2);
  const baseFare = 10;
  const perKmRate = 8;
  return Math.round(baseFare + distance * perKmRate);
};
```

### backend/controllers/driverController.js
```javascript
const User = require('../models/User');
const Ride = require('../models/Ride');
const Rating = require('../models/Rating');

exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.isAvailable = !user.isAvailable;
    await user.save();

    req.io.emit('driverAvailabilityChanged', {
      driverId: user._id,
      isAvailable: user.isAvailable,
    });

    res.json({
      success: true,
      isAvailable: user.isAvailable,
      message: `You are now ${user.isAvailable ? 'online' : 'offline'}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
    });

    req.io.emit('driverLocationUpdated', {
      driverId: req.user.id,
      location: { lat, lng },
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDriverStats = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id);

    const totalRides = await Ride.countDocuments({
      driver: req.user.id,
      status: 'completed',
    });

    const activeRide = await Ride.findOne({
      driver: req.user.id,
      status: { $in: ['accepted', 'inprogress'] },
    }).populate('passenger', 'name phone');

    const recentRides = await Ride.find({
      driver: req.user.id,
      status: 'completed',
    })
      .populate('passenger', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    const ratings = await Rating.find({ driver: req.user.id })
      .populate('passenger', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const totalEarnings = await Ride.aggregate([
      { $match: { driver: driver._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRides = await Ride.countDocuments({
      driver: req.user.id,
      status: 'completed',
      createdAt: { $gte: todayStart },
    });

    const todayEarnings = await Ride.aggregate([
      {
        $match: {
          driver: driver._id,
          status: 'completed',
          createdAt: { $gte: todayStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalRides,
        todayRides,
        averageRating: driver.averageRating,
        totalRatings: driver.totalRatings,
        totalEarnings: totalEarnings[0]?.total || 0,
        todayEarnings: todayEarnings[0]?.total || 0,
        isAvailable: driver.isAvailable,
        activeRide,
        recentRides,
        ratings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const dailyRides = await Ride.aggregate([
      {
        $match: {
          driver: require('mongoose').Types.ObjectId.createFromHexString(req.user.id),
          status: 'completed',
          createdAt: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          earnings: { $sum: '$fare' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const peakHours = await Ride.aggregate([
      {
        $match: {
          driver: require('mongoose').Types.ObjectId.createFromHexString(req.user.id),
          status: 'completed',
        },
      },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({ success: true, analytics: { dailyRides, peakHours } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### backend/routes/authRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
```

### backend/routes/rideRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const {
  requestRide, acceptRide, updateRideStatus, cancelRide,
  getRideHistory, getActiveRide, rateRide,
  getAvailableDrivers, getScheduledRides, getAllRides,
} = require('../controllers/rideController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/drivers/available', protect, getAvailableDrivers);
router.get('/history', protect, getRideHistory);
router.get('/active', protect, getActiveRide);
router.get('/scheduled', protect, restrictTo('passenger'), getScheduledRides);
router.get('/all', protect, getAllRides);
router.post('/request', protect, restrictTo('passenger'), requestRide);
router.put('/:id/accept', protect, restrictTo('driver'), acceptRide);
router.put('/:id/status', protect, updateRideStatus);
router.put('/:id/cancel', protect, cancelRide);
router.post('/:id/rate', protect, restrictTo('passenger'), rateRide);

module.exports = router;
```

### backend/routes/driverRoutes.js
```javascript
const express = require('express');
const router = express.Router();
const {
  toggleAvailability, updateLocation, getDriverStats, getAnalytics,
} = require('../controllers/driverController');
const { protect, restrictTo } = require('../middleware/auth');

router.put('/availability', protect, restrictTo('driver'), toggleAvailability);
router.put('/location', protect, restrictTo('driver'), updateLocation);
router.get('/stats', protect, restrictTo('driver'), getDriverStats);
router.get('/analytics', protect, restrictTo('driver'), getAnalytics);

module.exports = router;
```

### backend/socket/socketHandler.js
```javascript
const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on('driverLocationUpdate', (data) => {
      io.emit('driverLocationUpdated', data);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
```

### backend/server.js
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

socketHandler(io);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));

app.get('/', (req, res) => res.json({ message: 'CampusRide API Running' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Complete Frontend Source Code

### frontend/package.json
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "axios": "^1.7.0",
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hot-toast": "^2.1.0",
    "react-leaflet": "^4.0.2",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.9.0",
    "socket.io-client": "^4.1.0"
  }
}
```

### frontend/src/App.js
```javascript
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
```

### frontend/src/context/AuthContext.js
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### frontend/src/context/SocketContext.js
```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('joinRoom', user.id);
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
```

### frontend/src/components/ProtectedRoute.js
```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/home'} />;
  }

  return children;
};

export default ProtectedRoute;
```

### frontend/src/components/Navbar.js
```javascript
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
```

### frontend/src/services/api.js
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

export const requestRide = (data) => API.post('/rides/request', data);
export const acceptRide = (id) => API.put(`/rides/${id}/accept`);
export const updateRideStatus = (id, status) => API.put(`/rides/${id}/status`, { status });
export const cancelRide = (id) => API.put(`/rides/${id}/cancel`);
export const getRideHistory = () => API.get('/rides/history');
export const getActiveRide = () => API.get('/rides/active');
export const rateRide = (id, data) => API.post(`/rides/${id}/rate`, data);
export const getAvailableDrivers = () => API.get('/rides/drivers/available');
export const getScheduledRides = () => API.get('/rides/scheduled');
export const getAllRides = () => API.get('/rides/all');

export const toggleAvailability = () => API.put('/driver/availability');
export const updateLocation = (data) => API.put('/driver/location', data);
export const getDriverStats = () => API.get('/driver/stats');
export const getDriverAnalytics = () => API.get('/driver/analytics');
```

### frontend/src/pages/Login.js
```javascript
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(res.data.user.role === 'driver' ? '/driver' : '/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🛺</span>
          <h1>CampusRide</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

### frontend/src/pages/Register.js
```javascript
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
```

### frontend/src/components/MapComponent.js
```javascript
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const passengerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, 16); }, [center, map]);
  return null;
};

const MapComponent = ({ drivers = [], activeRide = null, userLocation = null, height = '400px' }) => {
  const defaultCenter = [29.8668, 77.8963];
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;

  return (
    <MapContainer center={center} zoom={15} style={{ height, width: '100%', borderRadius: '12px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={passengerIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {drivers.map((driver) => (
        driver.currentLocation?.coordinates[0] !== 0 && (
          <Marker
            key={driver._id}
            position={[driver.currentLocation.coordinates[1], driver.currentLocation.coordinates[0]]}
            icon={driverIcon}
          >
            <Popup>
              <strong>{driver.name}</strong><br />
              ⭐ {driver.averageRating || 'New'}<br />
              {driver.vehicleInfo?.vehicleType}
            </Popup>
          </Marker>
        )
      ))}

      {activeRide && (
        <>
          <Marker
            position={[activeRide.pickupLocation.coordinates.lat, activeRide.pickupLocation.coordinates.lng]}
            icon={pickupIcon}
          >
            <Popup>Pickup: {activeRide.pickupLocation.name}</Popup>
          </Marker>
          <Marker
            position={[activeRide.dropLocation.coordinates.lat, activeRide.dropLocation.coordinates.lng]}
          >
            <Popup>Drop: {activeRide.dropLocation.name}</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
};

export default MapComponent;
```

### frontend/src/pages/PassengerHome.js
```javascript
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
                  <strong>₹{Math.round(10 + Math.random() * 30)}</strong>
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
```

### frontend/src/pages/DriverHome.js
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toggleAvailability, updateLocation, getDriverStats, acceptRide, updateRideStatus, cancelRide } from '../services/api';
import MapComponent from '../components/MapComponent';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const DriverHome = () => {
  const { user, setUser } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDriverStats();
      setStats(res.data.stats);
      setActiveRide(res.data.stats.activeRide);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;
    socket.on('newRideRequest', (ride) => {
      if (user?.isAvailable) {
        setRideRequests((prev) => {
          if (prev.find((r) => r._id === ride._id)) return prev;
          return [ride, ...prev];
        });
        toast('🔔 New ride request!', { icon: '🛺' });
      }
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
      setRideRequests([]);
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
```

### frontend/src/pages/Profile.js
```javascript
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
```

### frontend/src/pages/RideHistory.js
```javascript
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
```

### frontend/src/pages/ScheduledRides.js
```javascript
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
```

### Frontend behavior summary
- Authentication: Login and registration with passenger/driver roles stored in localStorage via JWT.
- Passenger flow: request rides, see nearby drivers on a Leaflet map, receive live status updates, pay via cash/UPI, and rate rides after completion.
- Driver flow: toggle online/offline, receive ride requests in real time, accept or reject requests, start/complete rides, and view driver stats and recent earnings.
- Real-time networking: Socket.IO joins a personal room on login and listens for ride and driver events.
- UI/UX: React Router handles protected routes, Toast notifications provide feedback, and the campus map is centered around IIT Roorkee coordinates.

---

## Next Step (What needs to be done next)
The frontend is now documented in this context file. If another AI is continuing the project, the next step is to review and extend the existing React implementation, or debug any remaining runtime issues in the current frontend files.

**Last instruction given to user:**
Run this in a NEW terminal (keep backend running):
```bash
cd ..
cd frontend
npx create-react-app .
```

**Once create-react-app finishes, the frontend needs:**

### Frontend packages to install (after CRA finishes):
```bash
npm install axios socket.io-client react-router-dom leaflet react-leaflet recharts react-hot-toast
```

### Frontend folder structure to build:
```
frontend/src/
├── components/
│   ├── Navbar.js
│   ├── ProtectedRoute.js
│   ├── Map.js
│   └── LoadingSpinner.js
├── context/
│   ├── AuthContext.js
│   └── SocketContext.js
├── pages/
│   ├── Login.js
│   ├── Register.js
│   ├── PassengerHome.js
│   ├── DriverHome.js
│   ├── RideHistory.js
│   ├── ScheduledRides.js
│   ├── DriverDashboard.js
│   └── Profile.js
├── services/
│   └── api.js
├── App.js
├── App.css
└── index.js
```

### Key frontend features to implement:
1. Auth pages (Login + Register with role selection)
2. Passenger home (request ride, view available drivers on map, real-time ride status)
3. Driver home (toggle online/offline, view ride requests, accept/reject)
4. Real-time updates via Socket.IO for both passenger and driver
5. Driver dashboard (stats: total rides, earnings, ratings, charts using recharts)
6. Ride history page
7. Scheduled rides page
8. Ratings & feedback after ride completion
9. Live map with Leaflet showing driver locations and ride route
10. Simulated UPI payment screen

### Important notes for frontend AI:
- Backend runs on http://localhost:5000
- Frontend runs on http://localhost:3000
- Use axios for API calls with JWT token in Authorization header
- Use socket.io-client to connect to backend for real-time events
- Use react-router-dom v6 for routing
- Use react-hot-toast for notifications
- Use recharts for driver analytics charts
- Use leaflet + react-leaflet for maps
- IIT Roorkee campus coordinates: lat: 29.8668, lng: 77.8963
- Store JWT token in localStorage
- Two roles: 'passenger' and 'driver' - show different UIs based on role
