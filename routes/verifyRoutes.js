const express = require('express');
const { confirmEmail } = require('../controllers/verifyController');
const router = express.Router();

router.route('/confirmation/:email/:token')
  .get(confirmEmail);

module.exports = router;
