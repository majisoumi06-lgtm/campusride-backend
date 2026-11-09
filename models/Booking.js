const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seatsBooked: {
      type: Number,
      required: [true, 'Seats booked is required'],
      min: [1, 'At least 1 seat must be booked'],
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupLocation: {
      type: String,
      default: '',
      trim: true,
    },
    passengerNote: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending/active booking on the same ride by the same passenger
bookingSchema.index({ ride: 1, passenger: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
