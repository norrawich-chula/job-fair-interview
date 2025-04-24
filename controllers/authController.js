const User = require('../models/User');
const Token = require('../models/Token');
const nodemailer = require('nodemailer');

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, telephone, email, password, role } = req.body;

    if (!name || !telephone || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Create new user
    const user = await User.create({ name, telephone, email, password, role });

    // Create a token for the user
    const TokenModel = require('../models/Token');
    const newToken = new TokenModel({ _userId: user._id, token: user.getSignedJwtToken() });
    await newToken.save();

    // Setup the email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: 'no-reply@job_interview.com',
      to: user.email,
      subject: 'Verify your email',
      text: `Please verify your email by clicking the link: \nhttp://${req.headers.host}/confirmation/${user.email}/${newToken.token}\n\nThank You!\n`
    };

    // Send email and handle the response
    await transporter.sendMail(mailOptions);

    // Send token response to the client after email is sent
    sendTokenResponse(user, 201, res,newToken.token); // Make sure sendTokenResponse sends the response properly

  } catch (err) {
    console.error('REGISTER ERROR:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    return res.status(500).json({ success: false, message: 'Something went wrong' });
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
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'User not verified' });
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

// Helper: Get token, create cookie, and send response
const sendTokenResponse = (user, statusCode, res, email_token) => {
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
      token,
      email_token
  });
};
