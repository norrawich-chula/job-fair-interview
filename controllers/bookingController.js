const Booking = require('../models/Booking');
const Company = require('../models/Company');

// @desc    Get all bookings (user: only their own, admin: all)
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query;

    if (req.user && req.user.role === 'admin') {
      query = Booking.find().populate('company').populate('user', 'name email');
    } else {
      query = Booking.find({ user: req.user.id }).populate('company');
    }

    const bookings = await query;

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

// @desc    Get single booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('company')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking found with id ${req.params.id}` });
    }

    // Only allow owner or admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cannot fetch booking" });
  }
};

// @desc    Create a booking (max 3 per user)
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { company, date } = req.body;

    // Only allow role === 'user'
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users are allowed to create bookings'
      });
    }

    // Validate company existence
    const foundCompany = await Company.findById(company);
    if (!foundCompany) {
      return res.status(404).json({
        success: false,
        message: `No company found with id ${company}`
      });
    }

    // Validate date is within range
    const bookingDate = new Date(date);
    const startDate = new Date('2022-05-10');
    const endDate = new Date('2022-05-13');

    if (bookingDate < startDate || bookingDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be between May 10 and May 13, 2022'
      });
    }

    // Check for duplicate booking (same user, company, date)
    const duplicate = await Booking.findOne({ user: req.user.id, company, date });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You already booked this company on this date'
      });
    }

    // Enforce booking limit: max 3 per user
    const existingBookings = await Booking.find({ user: req.user.id });
    if (existingBookings.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You can only make up to 3 bookings'
      });
    }

    // Create booking
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

// @desc    Update a booking
// @route   PUT /api/v1/bookings/:id
// @access  Private (user or admin)
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with id ${req.params.id}`
      });
    }

    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // If admin, allow any update including skipping required validations
    if (isAdmin) {
      await Booking.updateOne({ _id: req.params.id }, req.body);
      const updated = await Booking.findById(req.params.id);
      return res.status(200).json({ success: true, data: updated });
    }

    // For normal user, enforce validation via save()
    Object.keys(req.body).forEach((key) => {
      booking[key] = req.body[key];
    });

    await booking.save(); // Enforce schema validation
    res.status(200).json({ success: true, data: booking });

  } catch (err) {
    console.error('❌ Error updating booking:', err);
    res.status(500).json({
      success: false,
      message: "Cannot update booking"
    });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private (user or admin)
exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id.trim();
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking with id ${req.params.id}` });
    }

    // Not allowed to cancel if the booking date is in the past or today
    const today = new Date();
    if (booking.date <= today && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking on or after the interview date'
      });
    }

    // Ensure the user is the owner or an admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this booking' });
    }

    await booking.deleteOne();

    res.status(200).json({ success: true, data: {}, message: "Delete booking Successful"  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Cannot delete booking" });
  }
};

  