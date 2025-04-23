const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Register a new user account
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, telephone, email, password, role } = req.body;

    // Create and save the new user in the database
    const user = await User.create({ name, telephone, email, password, role });

    // Return a JWT token in the response
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err.stack);
    res.status(400).json({ success: false, message: 'Registration failed' });
  }
};

// @desc    Login user and return JWT token
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ensure email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Look up the user by email (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if the entered password matches the stored hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Login successful – return token
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.stack);
    res.status(401).json({ success: false, message: 'Login failed' });
  }
};

// @desc    Logout user by clearing the cookie token
// @route   POST /api/v1/auth/logout
// @access  Public
exports.logout = (req, res) => {
  // Set token cookie to expire immediately
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ 
    success: true,
    data: {},
    message: 'Logged out successfully'
  });
};

// @desc    Get the currently logged-in user's profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // Find user by ID (from decoded JWT)
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Admin deletes a user and their related bookings
// @route   DELETE /api/v1/auth/users/:id
// @access  Private/Admin
exports.deleteUserByAdmin = async (req, res) => {
  try {
    // Look up user by ID
    const user = await User.findById(req.params.id);

    // If not found, return 404
    if (!user) {  
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete all bookings made by the user
    await Booking.deleteMany({ user: user._id });

    // Delete the user account
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User and related bookings deleted successfully' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Helper to send JWT token as cookie and JSON response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate signed JWT token from user model method
  const token = user.getSignedJwtToken();

  // Set cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true // Helps prevent XSS
  };

  // In production, require HTTPS
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Send token in cookie and response body
  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
