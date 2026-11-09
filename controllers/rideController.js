const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// @desc    Create a new ride offer
// @route   POST /api/rides
// @access  Private (Student/Driver)
exports.createRide = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      pickupPoint,
      dropoffPoint,
      departureDate,
      departureTime,
      vehicle,
      totalSeats,
      pricePerSeat,
      notes,
    } = req.body;

    if (
      !origin ||
      !destination ||
      !departureDate ||
      !departureTime ||
      !vehicle ||
      !vehicle.type ||
      !vehicle.model ||
      !vehicle.regNo ||
      !totalSeats ||
      pricePerSeat === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory ride details',
      });
    }

    const ride = await Ride.create({
      driver: req.user.id,
      origin: origin.trim(),
      destination: destination.trim(),
      pickupPoint: pickupPoint ? pickupPoint.trim() : origin.trim(),
      dropoffPoint: dropoffPoint ? dropoffPoint.trim() : destination.trim(),
      departureDate: new Date(departureDate),
      departureTime,
      vehicle,
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      pricePerSeat: Number(pricePerSeat),
      notes: notes ? notes.trim() : '',
      status: 'active',
    });

    const populatedRide = await Ride.findById(ride._id).populate(
      'driver',
      'name email phone college avatar rating'
    );

    res.status(201).json({
      success: true,
      message: 'Ride offered successfully!',
      ride: populatedRide,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active rides with search, filters & pagination
// @route   GET /api/rides
// @access  Public
exports.getRides = async (req, res, next) => {
  try {
    const { origin, destination, date, minSeats, page = 1, limit = 20 } = req.query;

    const query = {
      status: 'active',
      availableSeats: { $gt: 0 },
    };

    if (origin) {
      query.origin = { $regex: origin.trim(), $options: 'i' };
    }

    if (destination) {
      query.destination = { $regex: destination.trim(), $options: 'i' };
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.departureDate = {
        $gte: searchDate,
        $lt: nextDay,
      };
    }

    if (minSeats) {
      query.availableSeats = { $gte: Number(minSeats) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const totalRides = await Ride.countDocuments(query);
    const rides = await Ride.find(query)
      .populate('driver', 'name college avatar rating phone')
      .sort({ departureDate: 1, departureTime: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: rides.length,
      total: totalRides,
      totalPages: Math.ceil(totalRides / Number(limit)),
      currentPage: Number(page),
      rides,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ride by ID with detailed bookings and driver info
// @route   GET /api/rides/:id
// @access  Public
exports.getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email phone college avatar rating vehicle')
      .populate('passengers', 'name avatar college');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ride details (Driver only)
// @route   PUT /api/rides/:id
// @access  Private
exports.updateRide = async (req, res, next) => {
  try {
    let ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own rides',
      });
    }

    if (ride.status === 'cancelled' || ride.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${ride.status} ride`,
      });
    }

    const updatableFields = [
      'origin',
      'destination',
      'pickupPoint',
      'dropoffPoint',
      'departureDate',
      'departureTime',
      'pricePerSeat',
      'notes',
      'status',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        ride[field] = req.body[field];
      }
    });

    if (req.body.vehicle) {
      ride.vehicle = { ...ride.vehicle, ...req.body.vehicle };
    }

    await ride.save();

    res.status(200).json({
      success: true,
      message: 'Ride updated successfully',
      ride,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or cancel a ride
// @route   DELETE /api/rides/:id
// @access  Private
exports.deleteRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this ride',
      });
    }

    ride.status = 'cancelled';
    ride.availableSeats = 0;
    await ride.save();

    // Notify any confirmed/pending passengers
    const bookings = await Booking.find({
      ride: ride._id,
      status: { $in: ['pending', 'accepted'] },
    });

    for (const b of bookings) {
      b.status = 'cancelled';
      await b.save();

      await Notification.create({
        recipient: b.passenger,
        title: 'Ride Cancelled by Driver',
        message: `The ride from ${ride.origin} to ${ride.destination} scheduled for ${new Date(
          ride.departureDate
        ).toLocaleDateString()} was cancelled.`,
        type: 'ride_cancelled',
        link: '/my-bookings',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride has been cancelled and passengers have been notified.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rides created by the authenticated driver
// @route   GET /api/rides/my-rides
// @access  Private
exports.getMyRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ driver: req.user.id })
      .populate('passengers', 'name avatar phone college')
      .sort({ departureDate: -1, createdAt: -1 });

    // Attach pending requests count for each ride
    const ridesWithRequests = await Promise.all(
      rides.map(async (ride) => {
        const pendingCount = await Booking.countDocuments({
          ride: ride._id,
          status: 'pending',
        });
        const acceptedBookings = await Booking.find({
          ride: ride._id,
          status: 'accepted',
        }).populate('passenger', 'name phone avatar college studentId');

        return {
          ...ride.toObject(),
          pendingRequestsCount: pendingCount,
          acceptedPassengers: acceptedBookings,
        };
      })
    );

    res.status(200).json({
      success: true,
      rides: ridesWithRequests,
    });
  } catch (error) {
    next(error);
  }
};
