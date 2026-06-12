const Ride = require('../models/Ride');
const User = require('../models/User');
const Rating = require('../models/Rating');

exports.requestRide = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropLocation,
      scheduledTime,
      isScheduled,
      paymentMethod,
    } = req.body;

    const fare = calculateFare(pickupLocation.coordinates, dropLocation.coordinates);
    const distance = calculateDistance(
      pickupLocation.coordinates,
      dropLocation.coordinates
    );

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

    // Emit to all available drivers via socket
    req.io.emit('newRideRequest', ride);

    res.status(201).json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const hasActiveRide = await Ride.findOne({
      driver: req.user.id,
      status: { $in: ['accepted', 'inprogress'] },
    });

    if (hasActiveRide) {
      return res.status(400).json({ message: 'You already have an active ride' });
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'requested',
        driver: null,
      },
      {
        $set: {
          driver: req.user.id,
          status: 'accepted',
        },
      },
      { new: true }
    ).populate('passenger driver', 'name phone averageRating vehicleInfo');

    if (!ride) {
      const existingRide = await Ride.findById(req.params.id);
      if (!existingRide) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      return res.status(400).json({ message: 'Ride is no longer available' });
    }

    req.io.emit('rideAccepted', ride);
    req.io.to(ride.passenger.toString()).emit('yourRideAccepted', ride);

    res.status(200).json({ success: true, ride });
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
    const query =
      req.user.role === 'driver'
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
    const query =
      req.user.role === 'driver'
        ? {
            driver: req.user.id,
            status: { $in: ['accepted', 'inprogress'] },
          }
        : {
            passenger: req.user.id,
            status: { $in: ['requested', 'accepted', 'inprogress'] },
          };

    const ride = await Ride.findOne(query).populate(
      'passenger driver',
      'name phone averageRating vehicleInfo'
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

exports.getPendingRideRequests = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'requested' })
      .populate('passenger driver', 'name phone averageRating vehicleInfo')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, rides });
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

// Helper functions
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

const calculateFare = () => {
  return 10;
};