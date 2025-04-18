const Company = require('../models/Company');
const Booking = require('../models/Booking');

// @desc    Get all companies
// @route   GET /api/v1/companies
// @access  Public
exports.getCompanies = async (req, res) => {
  try {
    let query;

    // Copy request query for manipulation
    const reqQuery = { ...req.query };

    // Fields to exclude from base filtering
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Stringify and format MongoDB operators
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Base query
    query = Company.find(JSON.parse(queryStr)).populate('bookings');

    // ===== Select fields =====
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // ===== Sorting =====
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // ===== Pagination =====
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Company.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Execute final query
    const companies = await query;

    // Pagination info
    const pagination = {};
    if (endIndex < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };

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

// @desc    Get single company
// @route   GET /api/v1/companies/:id
// @access  Public
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('bookings');

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid company ID' });
  }
};

// @desc    Create new company
// @route   POST /api/v1/companies
// @access  Private (admin only)
exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    console.error(err.stack);
    res.status(400).json({ success: false, message: 'Company creation failed' });
  }
};

// @desc    Update company
// @route   PUT /api/v1/companies/:id
// @access  Private (admin only)
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
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

// @desc    Delete company
// @route   DELETE /api/v1/companies/:id
// @access  Private (admin only)
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Delete related bookings
    await Booking.deleteMany({ company: req.params.id });

    // Delete company
    await company.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Company deletion failed' });
  }
};
