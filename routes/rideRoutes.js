const express = require('express');
const router = express.Router();
const {
  createRide,
  getRides,
  getRideById,
  updateRide,
  deleteRide,
  getMyRides,
} = require('../controllers/rideController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createRide)
  .get(getRides);

router.get('/my-rides', protect, getMyRides);

router.route('/:id')
  .get(getRideById)
  .put(protect, updateRide)
  .delete(protect, deleteRide);

module.exports = router;
