const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// @route   /api/v1/bookings
router.route('/')
  .get(protect, getBookings) // user: own, admin: all
  .post(protect, authorize('user', 'admin'), createBooking);

router.route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('user', 'admin'), updateBooking)
  .delete(protect, authorize('user', 'admin'), deleteBooking);

module.exports = router;
