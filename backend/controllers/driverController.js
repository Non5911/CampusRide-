const User = require('../models/User');
const Ride = require('../models/Ride');
const Rating = require('../models/Rating');

exports.toggleAvailability = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable: !currentUser.isAvailable },
      { new: true }
    );

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
      currentLocation: {
        type: 'Point',
        coordinates: [lng, lat],
      },
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
      {
        $match: {
          driver: driver._id,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fare' },
        },
      },
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
      {
        $group: {
          _id: null,
          total: { $sum: '$fare' },
        },
      },
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
          driver: require('mongoose').Types.ObjectId.createFromHexString(
            req.user.id
          ),
          status: 'completed',
          createdAt: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          earnings: { $sum: '$fare' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const peakHours = await Ride.aggregate([
      {
        $match: {
          driver: require('mongoose').Types.ObjectId.createFromHexString(
            req.user.id
          ),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({ success: true, analytics: { dailyRides, peakHours } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};