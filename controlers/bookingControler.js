const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//const authController = require('../controlers/authControler');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
//const AppError = require('../utils/appError');

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // información sobre la sesion
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`, // esta no es una forma segura de hacerlo!!!!!
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // información sobre el producto a comprar
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //esto hay que cambiarlo cuando el sitio este en producción xq stripe descarga de una dirección real
        amount: tour.price * 100, // hay que multiplicarlo por 100 xq viene expresado en céntimos
        currency: 'eur',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response, send to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // Esto es temporal ,porque no es seguro :everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) {
    return next();
  }
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]); // original url is the entire url from which the request came
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
