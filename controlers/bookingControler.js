const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//const authController = require('../controlers/authControler');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
//const AppError = require('../utils/appError');

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  // 1) Tomar tour reservado
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // información sobre la sesion
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`, // esta no es una forma segura de hacerlo!!!!!
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // información sobre el producto a comprar  ---> Cambios sugeridos en https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15087442#questions/13208584
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: tour.price * 100, // hay que multiplicarlo por 100 xq viene expresado en céntimos
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            //images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //esto hay que cambiarlo cuando el sitio este en producción xq stripe descarga de una dirección real
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
        },
      },
    ],
  });

  // 3) Creando una sesion como respuesta, enviadosela al cliente
  res.status(200).json({
    status: 'success',
    session,
  });
});

/* exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // Esto es temporal ,porque no es seguro :everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) {
    return next();
  }
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]); // original url is the entire url from which the request came
}); */

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  console.log('recibido paquete');
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
