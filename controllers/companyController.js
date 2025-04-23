const Company = require('../models/Company');
const Booking = require('../models/Booking');

// @desc    Get all companies with optional filtering, sorting, and pagination
// @route   GET /api/v1/companies
// @access  Public
exports.getCompanies = async (req, res) => {
  try {
    let query;

    // Copy query params from request (to avoid mutating original object)
    const reqQuery = { ...req.query };

    // Fields to remove from the base query (they're for formatting, not filtering)
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Convert query operators like gt, lt into MongoDB format ($gt, $lt)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Build MongoDB query with population of related bookings
    query = Company.find(JSON.parse(queryStr)).populate('bookings');

    // ===== Field selection =====
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields); // Select only specific fields
    }

    // ===== Sorting =====
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy); // Custom sort
    } else {
      query = query.sort('-createdAt'); // Default sort: latest first
    }

    // ===== Pagination =====
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Company.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const companies = await query;

    // Build pagination result
    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

    // Respond with data
    res.status(200).json({
      success: true,
      count: companies.length,
      pagination,
      data: companies
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single company by ID
// @route   GET /api/v1/companies/:id
// @access  Public
exports.getCompany = async (req, res) => {
  try {
    // Find company by ID and include its bookings
    const company = await Company.findById(req.params.id).populate('bookings');

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Respond with company info
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid company ID' });
  }
};

// @desc    Create a new company
// @route   POST /api/v1/companies
// @access  Private (admin only)
exports.createCompany = async (req, res) => {
  try {
    // Create and save new company
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    console.error(err.stack);
    res.status(400).json({ success: false, message: 'Company creation failed' });
  }
};

// @desc    Update company details
// @route   PUT /api/v1/companies/:id
// @access  Private (admin only)
exports.updateCompany = async (req, res) => {
  try {
    // Find and update the company with new data
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,         // Return the updated document
      runValidators: true // Validate schema rules
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Company update failed' });
  }
};

// @desc    Delete a company and its associated bookings
// @route   DELETE /api/v1/companies/:id
// @access  Private (admin only)
exports.deleteCompany = async (req, res) => {
  try {
    // Find company by ID
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Delete all bookings associated with the company
    await Booking.deleteMany({ company: req.params.id });

    // Delete the company itself
    await company.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Company deletion failed' });
  }
};
