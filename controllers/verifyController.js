// It is GET method, you have to write like that
//    app.get('/confirmation/:email/:token',confirmEmail)

// @desc    GET verify email
// @route   GET /api/v1/confirmation/:email/:token
// @access  Public
const Token = require('../models/Token');
const User = require('../models/User');

exports.confirmEmail = async function (req, res, next) {
    try {
      const token = await Token.findOne({ token: req.params.token });
  
      if (!token) {
        return res.status(400).send({ msg: 'Your verification link may have expired. Please click on resend for verify your Email.' });
      }
  
      const user = await User.findOne({ _id: token._userId, email: req.params.email });
  
      if (!user) {
        return res.status(401).send({ msg: 'We were unable to find a user for this verification. Please SignUp!' });
      }
  
      if (user.isVerified) {
        return res.status(200).send('User has already been verified. Please Login');
      }
  
      user.isVerified = true;
      await user.save();
  
      return res.status(200).send('Your account has been successfully verified');
  
    } catch (err) {
      console.error('Verification Error:', err);
      return res.status(500).send({ msg: err.message });
    }
  };
  