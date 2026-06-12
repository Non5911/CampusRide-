const express = require('express');
const router = express.Router();
const {
  requestRide,
  acceptRide,
  updateRideStatus,
  cancelRide,
  getRideHistory,
  getActiveRide,
  rateRide,
  getAvailableDrivers,
  getScheduledRides,
  getPendingRideRequests,
  getAllRides,
} = require('../controllers/rideController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/drivers/available', protect, getAvailableDrivers);
router.get('/history', protect, getRideHistory);
router.get('/active', protect, getActiveRide);
router.get('/scheduled', protect, restrictTo('passenger'), getScheduledRides);
router.get('/pending', protect, restrictTo('driver'), getPendingRideRequests);
router.get('/all', protect, getAllRides);
router.post('/request', protect, restrictTo('passenger'), requestRide);
router.put('/:id/accept', protect, restrictTo('driver'), acceptRide);
router.put('/:id/status', protect, updateRideStatus);
router.put('/:id/cancel', protect, cancelRide);
router.post('/:id/rate', protect, restrictTo('passenger'), rateRide);

module.exports = router;