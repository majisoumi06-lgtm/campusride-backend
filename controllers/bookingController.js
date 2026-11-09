const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const Notification = require('../models/Notification');

// @desc    Book seats on a ride (Atomic & concurrency safe)
// @route   POST /api/bookings
// @access  Private (Passenger)
exports.createBooking = async (req, res, next) => {
  try {
    const { rideId, seatsBooked = 1, pickupLocation, passengerNote } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required to make a booking',
      });
    }

    const seatsToBook = Number(seatsBooked);
    if (seatsToBook < 1) {
      return res.status(400).json({
        success: false,
        message: 'Must book at least 1 seat',
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Driver cannot book their own ride
    if (ride.driver.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book a seat on your own ride offer',
      });
    }

    if (ride.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Ride is ${ride.status} and cannot be booked`,
      });
    }

    // Check duplicate pending or accepted booking
    const existingBooking = await Booking.findOne({
      ride: rideId,
      passenger: req.user.id,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending booking for this ride',
      });
    }

    // Concurrency-safe seat reservation using atomic findOneAndUpdate
    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: 'active',
        availableSeats: { $gte: seatsToBook },
      },
      {
        $inc: { availableSeats: -seatsToBook },
      },
      { new: true }
    );

    if (!updatedRide) {
      return res.status(400).json({
        success: false,
        message: 'Not enough available seats or ride is no longer active',
      });
    }

    const totalPrice = seatsToBook * ride.pricePerSeat;

    const booking = await Booking.create({
      ride: ride._id,
      passenger: req.user.id,
      driver: ride.driver,
      seatsBooked: seatsToBook,
      totalPrice,
      pickupLocation: pickupLocation || ride.pickupPoint,
      passengerNote: passengerNote || '',
      status: 'pending',
    });

    // Notify driver about the new booking request
    await Notification.create({
      recipient: ride.driver,
      title: 'New Ride Booking Request',
      message: `${req.user.name} requested ${seatsToBook} seat(s) on your ride to ${ride.destination}.`,
      type: 'booking_request',
      link: '/my-rides',
    });

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully to driver!',
      booking,
      remainingSeats: updatedRide.availableSeats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for authenticated passenger
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ passenger: req.user.id })
      .populate({
        path: 'ride',
        populate: {
          path: 'driver',
          select: 'name phone college avatar rating vehicle',
        },
      })
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

// @desc    Accept a booking request (Driver only)
// @route   PUT /api/bookings/:id/accept
// @access  Private
exports.acceptBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the ride driver can accept bookings',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Booking request is already ${booking.status}`,
      });
    }

    booking.status = 'accepted';
    await booking.save();

    // Add passenger to ride confirmed passengers list
    await Ride.findByIdAndUpdate(booking.ride._id, {
      $addToSet: { passengers: booking.passenger },
    });

    // Notify passenger
    await Notification.create({
      recipient: booking.passenger,
      title: 'Booking Confirmed!',
      message: `Your ride booking for ${booking.ride.destination} has been accepted by the driver.`,
      type: 'booking_accepted',
      link: '/my-bookings',
    });

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a booking request (Driver only)
// @route   PUT /api/bookings/:id/reject
// @access  Private
exports.rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the ride driver can reject bookings',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Booking request is already ${booking.status}`,
      });
    }

    booking.status = 'rejected';
    await booking.save();

    // Release reserved seats back to ride
    await Ride.findByIdAndUpdate(booking.ride._id, {
      $inc: { availableSeats: booking.seatsBooked },
    });

    // Notify passenger
    await Notification.create({
      recipient: booking.passenger,
      title: 'Booking Request Declined',
      message: `Your booking request for ${booking.ride.destination} was declined by the driver.`,
      type: 'booking_rejected',
      link: '/find-rides',
    });

    res.status(200).json({
      success: true,
      message: 'Booking declined and seats released',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking (Passenger or Admin)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('ride');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (
      booking.passenger.toString() !== req.user.id &&
      booking.driver.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    await booking.save();

    // If booking was pending or accepted, release seats back to the ride
    if (previousStatus === 'pending' || previousStatus === 'accepted') {
      await Ride.findByIdAndUpdate(booking.ride._id, {
        $inc: { availableSeats: booking.seatsBooked },
        $pull: { passengers: booking.passenger },
      });
    }

    // Notify other party
    const isPassengerCancelling = booking.passenger.toString() === req.user.id;
    const recipient = isPassengerCancelling ? booking.driver : booking.passenger;

    await Notification.create({
      recipient,
      title: 'Booking Cancelled',
      message: `${req.user.name} cancelled the booking for ${booking.ride.destination}.`,
      type: 'booking_cancelled',
      link: isPassengerCancelling ? '/my-rides' : '/my-bookings',
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled and seats restored',
      booking,
    });
  } catch (error) {
    next(error);
  }
};
