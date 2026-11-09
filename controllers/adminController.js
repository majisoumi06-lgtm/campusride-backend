const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');

// @desc    Get system-wide summary metrics for admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({
      role: 'student',
      status: 'active',
    });
    const suspendedStudents = await User.countDocuments({
      status: 'suspended',
    });

    const totalRides = await Ride.countDocuments();
    const activeRides = await Ride.countDocuments({ status: 'active' });
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });

    const totalBookings = await Booking.countDocuments();
    const acceptedBookings = await Booking.countDocuments({ status: 'accepted' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Recent 5 rides and bookings
    const recentRides = await Ride.find()
      .populate('driver', 'name college avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = await Booking.find()
      .populate('passenger', 'name email college')
      .populate('ride', 'origin destination departureDate')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalStudents,
          active: activeStudents,
          suspended: suspendedStudents,
        },
        rides: {
          total: totalRides,
          active: activeRides,
          completed: completedRides,
          cancelled: cancelledRides,
        },
        bookings: {
          total: totalBookings,
          accepted: acceptedBookings,
          pending: pendingBookings,
        },
      },
      recentRides,
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search and filter
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, status, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (role) query.role = role;

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (e.g. active vs suspended)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'suspended'",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rides for admin monitoring
// @route   GET /api/admin/rides
// @access  Private (Admin only)
exports.getAllRides = async (req, res, next) => {
  try {
    const rides = await Ride.find()
      .populate('driver', 'name email college phone')
      .populate('passengers', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for admin monitoring
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('passenger', 'name email college phone')
      .populate('driver', 'name email phone')
      .populate('ride', 'origin destination departureDate departureTime')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};
