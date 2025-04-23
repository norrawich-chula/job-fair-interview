const mongoose = require('mongoose');

// Define the schema for interview session bookings
const BookingSchema = new mongoose.Schema({
  // Date of the interview session
  date: {
    type: Date,
    required: true,
    validate: {
      // Only allow dates between May 10–13, 2025
      validator: (value) => {
        const min = new Date('2025-05-10');
        const max = new Date('2025-05-13');
        return value >= min && value <= max;
      },
      message: 'Booking date must be between May 10 and May 13, 2025'
    }
  },

  // Reference to the user who made the booking
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },

  // Reference to the company the user is interviewing with
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },

  // Timestamp when the booking was created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model for use in controllers/services
module.exports = mongoose.model('Booking', BookingSchema);
