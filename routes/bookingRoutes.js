const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createBooking);

router.get('/my-bookings', getMyBookings);
router.put('/:id/accept', acceptBooking);
router.put('/:id/reject', rejectBooking);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
