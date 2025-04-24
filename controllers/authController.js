const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, telephone, email, password, role } = req.body;

    // Create new user
    const user = await User.create({ name, telephone, email, password, role });

    // Send token in response
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err.stack);
    res.status(400).json({ success: false, message: 'Registration failed' });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Send token
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.stack);
    res.status(401).json({ success: false, message: 'Login failed' });
  }
};

// @desc    Logout user (client should clear cookie/token)
// @route   POST /api/v1/auth/logout
// @access  Public
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ 
    success: true,
    data: {},
    message: 'Logged out successfully' });
};

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
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

// @desc    Delete a user account by admin (and their bookings)
// @route   DELETE /api/v1/auth/users/:id
// @access  Private/Admin
exports.deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {  
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete all bookings belonging to the user
    await Booking.deleteMany({ user: user._id });

    // Delete the user account
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User and related bookings deleted successfully' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// Helper: Get token, create cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
  .cookie('token', token, options)
  .json({
      success: true,
      token
  });
};
