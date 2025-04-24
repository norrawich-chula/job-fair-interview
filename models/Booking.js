const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => {
        const min = new Date('2022-05-10');
        const max = new Date('2022-05-13');
        return value >= min && value <= max;
      },
      message: 'Booking date must be between May 10 and May 13, 2022'
    }
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
