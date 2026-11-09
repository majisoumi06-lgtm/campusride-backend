const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    origin: {
      type: String,
      required: [true, 'Please provide starting location/origin'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Please provide destination'],
      trim: true,
    },
    pickupPoint: {
      type: String,
      default: '',
      trim: true,
    },
    dropoffPoint: {
      type: String,
      default: '',
      trim: true,
    },
    departureDate: {
      type: Date,
      required: [true, 'Please provide departure date'],
    },
    departureTime: {
      type: String,
      required: [true, 'Please provide departure time (e.g. 08:30 AM)'],
    },
    vehicle: {
      type: {
        type: String,
        required: [true, 'Please specify vehicle type (e.g. Sedan, SUV, Bike)'],
      },
      model: {
        type: String,
        required: [true, 'Please specify vehicle model (e.g. Honda Civic)'],
      },
      regNo: {
        type: String,
        required: [true, 'Please specify vehicle registration number'],
      },
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please provide total seats offered'],
      min: [1, 'At least 1 seat must be offered'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats count is required'],
      min: [0, 'Available seats cannot be negative'],
    },
    pricePerSeat: {
      type: Number,
      required: [true, 'Please specify price per seat in local currency'],
      min: [0, 'Price cannot be negative'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    passengers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexing for search performance
rideSchema.index({ origin: 'text', destination: 'text' });
rideSchema.index({ departureDate: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);
