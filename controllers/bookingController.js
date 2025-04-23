// Import Mongoose models
const Booking = require('../models/Booking');
const Company = require('../models/Company');

// @desc    Get all bookings (admin gets all, user gets their own)
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query;

    // If admin, get all bookings with user and company info
    if (req.user && req.user.role === 'admin') {
      query = Booking.find().populate('company').populate('user', 'name email');
    } else {
      // Regular users can only see their own bookings
      query = Booking.find({ user: req.user.id }).populate('company');
    }

    const bookings = await query;

    // Send response
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cannot retrieve bookings" });
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('company')
      .populate('user', 'name email');

    // Return 404 if booking not found
    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking found with id ${req.params.id}` });
    }

    // Check if user owns the booking or is an admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    // Send booking info
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cannot fetch booking" });
  }
};

// @desc    Create a new booking (limit 3 per user)
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { company, date } = req.body;

    // Only users (not admins) can create bookings
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users are allowed to create bookings'
      });
    }

    // Check that the selected company exists
    const foundCompany = await Company.findById(company);
    if (!foundCompany) {
      return res.status(404).json({
        success: false,
        message: `No company found with id ${company}`
      });
    }

    // Allow bookings only between specific dates
    const bookingDate = new Date(date);
    const startDate = new Date('2025-05-10');
    const endDate = new Date('2025-05-13');

    if (bookingDate < startDate || bookingDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be between May 10 and May 13, 2025'
      });
    }

    // Prevent duplicate booking with the same company and date
    const duplicate = await Booking.findOne({ user: req.user.id, company, date });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You already booked this company on this date'
      });
    }

    // Limit total bookings to 3 per user
    const existingBookings = await Booking.find({ user: req.user.id });
    if (existingBookings.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You can only make up to 3 bookings'
      });
    }

    // Create the booking
    const booking = await Booking.create({
      user: req.user.id,
      company,
      date
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Cannot create booking',
      error: err.message
    });
  }
};

// @desc    Update an existing booking
// @route   PUT /api/v1/bookings/:id
// @access  Private (user or admin)
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    // Return 404 if not found
    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking with id ${req.params.id}` });
    }

    // Only the owner or admin can update
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this booking' });
    }

    // Apply updates with validation
    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cannot update booking" });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private (user or admin)
exports.deleteBooking = async (req, res) => {
  try {
    // Trim to avoid ObjectId cast error
    const bookingId = req.params.id.trim();
    const booking = await Booking.findById(bookingId);

    // Return 404 if booking not found
    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking with id ${req.params.id}` });
    }

    // Disallow deletion for today or past dates unless admin
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const bookingDate = new Date(booking.date);
    const bookingDateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

    if (bookingDateOnly <= today && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Bookings cannot be canceled on or after the scheduled interview date'
      });
    }

    // Only the user or admin can delete
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this booking' });
    }

    // Delete the booking
    await booking.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cannot delete booking" });
  }
};
