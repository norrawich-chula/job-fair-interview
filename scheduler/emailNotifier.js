const cron = require('node-cron');
const dayjs = require('dayjs');
const { sendNotification } = require('../utils/mailer');
const Booking = require('../models/Booking.js');

// Run at 8 AM every day
cron.schedule('0 8 * * *', async () => {
    try {
      const now = dayjs();
      const bookings = await Booking.find({
        date: {
          $gte: now.startOf('day').toDate(),
          $lt: now.endOf('day').toDate(),
        }
      }).populate('user'); // populate user if it's a reference
  
      for (const booking of bookings) {
        if (booking.user?.email) {
          await sendNotification(
            booking.user.email,
            'Reminder',
            `Hey ${booking.user.name || ''}, you have a booking scheduled today.`
          );
          console.log(`Sent to ${booking.user.email}`);
        } else {
          console.log(`Booking ${booking._id} has no email`);
        }
      }
    } catch (err) {
      console.error('Error during scheduled task:', err);
    }
  });