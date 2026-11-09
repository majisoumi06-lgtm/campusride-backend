const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get current user profile with ride/booking statistics
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const ridesOffered = await Ride.countDocuments({ driver: req.user.id });
    const bookingsMade = await Booking.countDocuments({ passenger: req.user.id });
    const reviewsReceived = await Review.find({ reviewee: req.user.id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user,
      stats: {
        ridesOffered,
        bookingsMade,
        totalReviews: reviewsReceived.length,
      },
      reviews: reviewsReceived,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, college, studentId, avatar, vehicle } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phone) fieldsToUpdate.phone = phone;
    if (college) fieldsToUpdate.college = college;
    if (studentId) fieldsToUpdate.studentId = studentId;
    if (avatar !== undefined) fieldsToUpdate.avatar = avatar;
    if (vehicle) fieldsToUpdate.vehicle = vehicle;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public profile of another user
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id).select(
      'name college avatar rating vehicle createdAt'
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });

    const ridesCount = await Ride.countDocuments({
      driver: req.params.id,
      status: { $in: ['active', 'completed'] },
    });

    res.status(200).json({
      success: true,
      user: targetUser,
      ridesCount,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
