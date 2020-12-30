const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controlers/errorControler');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controlers/bookingControler');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

//Relacionado con probar si una conexión es segura o no cuando tiene su aplicación implementada en Heroku ---->ver authControler.js
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS --->"CROSS ORIGINAL SERVICE"
app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
//Serving stattic files
//app.use(express.static(`${__dirname}/starter/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Establecer encabezados HTTP seguros
app.use(helmet()); // helmet() debe estar el primero en nuestro middleware stack

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limitar las solicitudes de la misma API
// Hacker protection - 'brute force' protection
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// lo colocamos aqui xp stripe necesita el webhook en la RAW version
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Saneamiento de datos contra la inyección de consultas NoSQL: limpia los datos del código malicioso
app.use(mongoSanitize());

// Saneamiento de datos contra XSS
app.use(xss());

// Previsión contra contaminación de parámetros.
// Permite duplicados en la cadena de consulta para propiedades en la lista blanca.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

/*app.use((req, res, next) => {
  console.log('Hola desde un middelware!!!');
  next();
});*/

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 2) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  /*res.status(404).json({
    status: 'fail',
    messge: `Imposible alcanzar ${req.originalUrl} en este servidor`,
  });*/

  /*const err = new Error(
    `Imposible alcanzar ${req.originalUrl} en este servidor`
  );
  err.status = 'fail';
  err.statusCode = 404;*/

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// 3) ARRANCAR EL SERVIDOR CONFIGURADO
module.exports = app;
