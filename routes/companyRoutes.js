const express = require('express');
const {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

const { protect, authorize } = require('../middleware/auth');

// Optional: If you want to allow nested routes like /companies/:companyId/bookings
const bookingRouter = require('./bookingRoutes');

const router = express.Router();

// Re-route into booking router for nested route access
router.use('/:companyId/bookings', bookingRouter);;

router.route('/')
  .get(getCompanies)
  .post(protect, authorize('admin'), createCompany);

router.route('/:id')
  .get(getCompany)
  .put(protect, authorize('admin'), updateCompany)
  .delete(protect, authorize('admin'), deleteCompany);

module.exports = router;
