//const { render } = require('pug');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      'Tu reserva ha sido realizada. Por favor comprueba tu email para confirmarlo. Si tu reserva no aparece inmediatamente, por favor revisa más tarde.';
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1)Tomar los datos de los tours desde la colección
  const tours = await Tour.find();

  // 2)Construir la plantilla
  // 3)Render la plantilla con los datos de 1)
  //    Estamos pasando datos a las plantillas pug usando la función de render.
  //    Todo lo que pongamos en la función de renderización será una variable dentro de las plantillas pug.

  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // Tomar los datos desde la colección incluidas las reviews
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('No existe ningun tour con ese nombre.', 404));
  }

  // 2) Construir la plantilla
  // 3)Render la plantilla con los datos de 1)

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Mi cuenta',
  });
};

//actualizar un usario sin una API
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Mi cuenta',
    user: updateUser,
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  // Esto se puede realizar con un populate
  // 1) Encontrar todas las reservas
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Encontrar todos los tours con los Ids
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //encuentra todos los tours con el Id presentes en el array tourIDs
  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});
