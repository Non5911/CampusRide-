const express = require('express');
const router = express.Router();
const {
  toggleAvailability,
  updateLocation,
  getDriverStats,
  getAnalytics,
} = require('../controllers/driverController');
const { protect, restrictTo } = require('../middleware/auth');

router.put('/availability', protect, restrictTo('driver'), toggleAvailability);
router.put('/location', protect, restrictTo('driver'), updateLocation);
router.get('/stats', protect, restrictTo('driver'), getDriverStats);
router.get('/analytics', protect, restrictTo('driver'), getAnalytics);

module.exports = router;