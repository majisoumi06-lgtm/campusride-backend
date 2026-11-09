const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] MongoDB Connected successfully.');

    // Clear existing collections
    console.log('[Seed] Clearing existing data...');
    await User.deleteMany({});
    await Ride.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Creating demo users (Admin & Students)...');

    // 1. Admin User
    const adminUser = await User.create({
      name: 'Campus Transport Admin',
      email: 'admin@campusride.edu',
      password: 'Admin@123',
      phone: '+1 (555) 019-2834',
      college: 'University Central Administration',
      studentId: 'ADM-2025-001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      role: 'admin',
      status: 'active',
      rating: { average: 5.0, count: 12 },
    });

    // 2. Student Driver 1
    const alex = await User.create({
      name: 'Alex Rivera',
      email: 'alex@campusride.edu',
      password: 'Student@123',
      phone: '+1 (555) 234-5678',
      college: 'School of Computer Science',
      studentId: 'STU-CS-4091',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      role: 'student',
      status: 'active',
      rating: { average: 4.9, count: 18 },
      vehicle: {
        hasVehicle: true,
        type: 'Car',
        model: 'Toyota Camry (Silver)',
        regNo: 'CAM-8821',
        capacity: 4,
      },
    });

    // 3. Student Driver 2
    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@campusride.edu',
      password: 'Student@123',
      phone: '+1 (555) 345-6789',
      college: 'College of Engineering & Architecture',
      studentId: 'STU-ENG-1204',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      role: 'student',
      status: 'active',
      rating: { average: 5.0, count: 24 },
      vehicle: {
        hasVehicle: true,
        type: 'Car',
        model: 'Honda Civic (Blue)',
        regNo: 'CIV-3309',
        capacity: 3,
      },
    });

    // 4. Student Driver 3
    const marcus = await User.create({
      name: 'Marcus Chen',
      email: 'marcus@campusride.edu',
      password: 'Student@123',
      phone: '+1 (555) 456-7890',
      college: 'School of Business & Economics',
      studentId: 'STU-BUS-7823',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      role: 'student',
      status: 'active',
      rating: { average: 4.8, count: 9 },
      vehicle: {
        hasVehicle: true,
        type: 'Car',
        model: 'Hyundai Elantra (White)',
        regNo: 'HYU-9041',
        capacity: 4,
      },
    });

    // 5. Student Passenger 1
    const sarah = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@campusride.edu',
      password: 'Student@123',
      phone: '+1 (555) 567-8901',
      college: 'Faculty of Arts & Humanities',
      studentId: 'STU-ART-3312',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
      role: 'student',
      status: 'active',
      rating: { average: 5.0, count: 7 },
      vehicle: { hasVehicle: false },
    });

    // 6. Student Passenger 2
    const david = await User.create({
      name: 'David Kim',
      email: 'david@campusride.edu',
      password: 'Student@123',
      phone: '+1 (555) 678-9012',
      college: 'School of Medicine',
      studentId: 'STU-MED-8819',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      role: 'student',
      status: 'active',
      rating: { average: 4.7, count: 5 },
      vehicle: { hasVehicle: false },
    });

    console.log('[Seed] Creating demo campus rides...');

    // Tomorrow date helper
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const weekendDate = new Date();
    weekendDate.setDate(weekendDate.getDate() + 4);

    const ride1 = await Ride.create({
      driver: alex._id,
      origin: 'North Campus Library',
      destination: 'Downtown Metro Station',
      pickupPoint: 'North Gate Bus Stop (Opposite Library)',
      dropoffPoint: 'Downtown Metro Exit B',
      departureDate: tomorrow,
      departureTime: '08:30 AM',
      vehicle: {
        type: 'Car',
        model: 'Toyota Camry (Silver)',
        regNo: 'CAM-8821',
      },
      totalSeats: 3,
      availableSeats: 2, // 1 booked by Sarah
      pricePerSeat: 4.5,
      notes: 'Leaving right at 8:30 AM. Has trunk space for backpacks and luggage. AC on.',
      status: 'active',
      passengers: [sarah._id],
    });

    const ride2 = await Ride.create({
      driver: priya._id,
      origin: 'Student Housing Block B',
      destination: 'Tech Innovation Park',
      pickupPoint: 'Block B Dormitory Circular Drive',
      dropoffPoint: 'Tech Park Main Reception Tower',
      departureDate: tomorrow,
      departureTime: '09:15 AM',
      vehicle: {
        type: 'Car',
        model: 'Honda Civic (Blue)',
        regNo: 'CIV-3309',
      },
      totalSeats: 3,
      availableSeats: 3,
      pricePerSeat: 5.0,
      notes: 'Going to the Tech Park for internship hours. Quiet ride or good music.',
      status: 'active',
      passengers: [],
    });

    const ride3 = await Ride.create({
      driver: marcus._id,
      origin: 'West Campus Sports Complex',
      destination: 'Central Railway Station',
      pickupPoint: 'Gymnasium Entrance 1',
      dropoffPoint: 'Railway Station North Porch',
      departureDate: dayAfter,
      departureTime: '04:45 PM',
      vehicle: {
        type: 'Car',
        model: 'Hyundai Elantra (White)',
        regNo: 'HYU-9041',
      },
      totalSeats: 4,
      availableSeats: 3, // 1 booked by David
      pricePerSeat: 6.0,
      notes: 'Heading home for the weekend. Splitting fuel cost equally.',
      status: 'active',
      passengers: [david._id],
    });

    const ride4 = await Ride.create({
      driver: alex._id,
      origin: 'Engineering Quad',
      destination: 'Airport Transit Terminal',
      pickupPoint: 'Mechanical Eng Building Rotunda',
      dropoffPoint: 'Terminal 2 Departures',
      departureDate: weekendDate,
      departureTime: '06:00 AM',
      vehicle: {
        type: 'Car',
        model: 'Toyota Camry (Silver)',
        regNo: 'CAM-8821',
      },
      totalSeats: 3,
      availableSeats: 3,
      pricePerSeat: 12.0,
      notes: 'Early morning flight run. Please be on time at 05:55 AM sharp.',
      status: 'active',
      passengers: [],
    });

    console.log('[Seed] Creating demo bookings...');

    // Booking 1: Sarah booked Alex's ride (Accepted)
    await Booking.create({
      ride: ride1._id,
      passenger: sarah._id,
      driver: alex._id,
      seatsBooked: 1,
      totalPrice: 4.5,
      pickupLocation: 'North Gate Bus Stop',
      passengerNote: 'I have one small laptop bag.',
      status: 'accepted',
    });

    // Booking 2: David booked Marcus's ride (Accepted)
    await Booking.create({
      ride: ride3._id,
      passenger: david._id,
      driver: marcus._id,
      seatsBooked: 1,
      totalPrice: 6.0,
      pickupLocation: 'Gymnasium Entrance 1',
      passengerNote: 'Going to catch the 6:00 PM express train.',
      status: 'accepted',
    });

    // Booking 3: Pending booking by David on Priya's ride
    await Booking.create({
      ride: ride2._id,
      passenger: david._id,
      driver: priya._id,
      seatsBooked: 1,
      totalPrice: 5.0,
      pickupLocation: 'Block B Dormitory',
      passengerNote: 'Can you drop me off near building 4?',
      status: 'pending',
    });

    console.log('[Seed] Creating demo reviews and notifications...');

    // Review for Priya
    await Review.create({
      ride: ride2._id,
      reviewer: sarah._id,
      reviewee: priya._id,
      rating: 5,
      comment: 'Super smooth and on time! Priya was very friendly and drove very safely.',
    });

    // Review for Alex
    await Review.create({
      ride: ride1._id,
      reviewer: david._id,
      reviewee: alex._id,
      rating: 5,
      comment: 'Great ride to campus! Saved me almost an hour compared to public bus.',
    });

    // Notification for Alex
    await Notification.create({
      recipient: alex._id,
      title: 'Booking Confirmed',
      message: 'Sarah Johnson joined your ride to Downtown Metro Station.',
      type: 'booking_accepted',
      link: '/my-rides',
    });

    // Notification for Priya
    await Notification.create({
      recipient: priya._id,
      title: 'New Booking Request',
      message: 'David Kim requested 1 seat on your ride to Tech Innovation Park.',
      type: 'booking_request',
      link: '/my-rides',
    });

    console.log('\n======================================================');
    console.log('✅ CampusRide Database Seeded Successfully!');
    console.log('======================================================');
    console.log('Demo Credentials:');
    console.log('  Admin User:');
    console.log('    Email:    admin@campusride.edu');
    console.log('    Password: Admin@123');
    console.log('  Student / Driver (Alex):');
    console.log('    Email:    alex@campusride.edu');
    console.log('    Password: Student@123');
    console.log('  Student / Driver (Priya):');
    console.log('    Email:    priya@campusride.edu');
    console.log('    Password: Student@123');
    console.log('  Student / Passenger (Sarah):');
    console.log('    Email:    sarah@campusride.edu');
    console.log('    Password: Student@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
