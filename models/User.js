const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Define User schema
const UserSchema = new mongoose.Schema({
  // User's full name
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  // Phone number (9–10 digits)
  telephone: {
    type: String,
    required: [true, 'Please add a telephone number'],
    match: [/^\d{9,10}$/, 'Phone number must be 9–10 digits']
  },

  // Unique email address
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please add a valid email'
    ]
  },

  // Role for access control (default is 'user')
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Password (minimum 6 characters, not selected by default)
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Hide password field in queries by default
  },

  // Account creation date
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Password reset support fields (optional use)
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

// Pre-save middleware: Hash password if modified
UserSchema.pre('save', async function (next) {
  // Skip hashing if password hasn't changed
  if (!this.isModified('password')) return next();

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Instance method: Generate signed JWT for user
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE // e.g., '1h' or '30d'
  });
};

// Instance method: Compare raw password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model
module.exports = mongoose.model('User', UserSchema);
