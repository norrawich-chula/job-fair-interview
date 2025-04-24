const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  deleteUserByAdmin
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

// Admin-only route to delete a user by ID
router.delete('/users/:id', protect, authorize('admin'), deleteUserByAdmin);

module.exports = router;
