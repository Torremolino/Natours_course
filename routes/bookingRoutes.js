const express = require('express');
const bookingControler = require('../controlers/bookingControler');
const authControler = require('../controlers/authControler');

const router = express.Router();

router.use(authControler.protect);

router.get('/checkout-session/:tourId', bookingControler.getCheckOutSession);

router.use(authControler.restricTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingControler.getAllBookings)
  .post(bookingControler.createBooking);

router
  .route('/:id')
  .get(bookingControler.getBooking)
  .patch(bookingControler.updateBooking)
  .delete(bookingControler.deleteBooking);

module.exports = router;
