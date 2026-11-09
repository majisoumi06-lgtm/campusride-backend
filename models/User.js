const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'Please provide your college or university name'],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, 'Please provide your student ID number'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    rating: {
      average: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    vehicle: {
      hasVehicle: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ['Car', 'Motorcycle', 'Scooter', 'SUV', 'Other', ''],
        default: '',
      },
      model: {
        type: String,
        default: '',
      },
      regNo: {
        type: String,
        default: '',
      },
      capacity: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
