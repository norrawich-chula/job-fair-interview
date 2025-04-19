const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

exports.sendNotification = (email, subject, text) => {
  return transporter.sendMail({
    from: `"Notifier" <${process.env.MAIL_USER}>`,
    to: email,
    subject,
    text
  });
};
