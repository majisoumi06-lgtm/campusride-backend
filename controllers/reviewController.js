const Review = require('../models/Review');
const User = require('../models/User');
const Ride = require('../models/Ride');

// @desc    Submit a review and update reviewee average rating
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { rideId, revieweeId, rating, comment } = req.body;

    if (!rideId || !revieweeId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rideId, revieweeId, rating (1-5) and comment',
      });
    }

    if (revieweeId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review yourself',
      });
    }

    const review = await Review.create({
      ride: rideId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Recalculate average rating for reviewee
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating =
      allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      rating: {
        average: Number(avgRating.toFixed(1)),
        count: allReviews.length,
      },
    });

    const populatedReview = await Review.findById(review._id).populate(
      'reviewer',
      'name avatar college'
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews received by a user
// @route   GET /api/reviews/:userId
// @access  Public
exports.getReviewsByUser = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar college')
      .populate('ride', 'origin destination departureDate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
