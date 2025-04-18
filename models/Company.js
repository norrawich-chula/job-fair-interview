const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    trim: true
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*\/?$/,
      'Please enter a valid website URL'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  telephone: {
    type: String,
    required: [true, 'Please add a telephone number'],
    match: [/^\d{9,10}$/, 'Telephone number must be 9–10 digits']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate bookings for this company
CompanySchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'company',
  justOne: false
});

module.exports = mongoose.model('Company', CompanySchema);
