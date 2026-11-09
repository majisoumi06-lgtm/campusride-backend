const express = require('express');
const router = express.Router();
const {
  createReview,
  getReviewsByUser,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/:userId', getReviewsByUser);

module.exports = router;
