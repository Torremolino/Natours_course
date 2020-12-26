const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const glogarErrorHandler = require('./controlers/errorControler');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRoutes = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDELWARES
//Serving stattic files
//app.use(express.static(`${__dirname}/starter/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set secury HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanintization against XSS
app.use(xss());

//Prevent parameter pollution
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

/*app.use((req, res, next) => {
  console.log('Hola desde un middelware!!!');
  next();
});*/

// Test middleware
app.use((req, res, next) => {
  req.requesTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

// 2)ROUTE HANDLERS

// 3) ROUTES
app.use('/', viewRoutes);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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

  next(
    new AppError(`Imposible alcanzar ${req.originalUrl} en este servidor`, 404)
  );
});

app.use(glogarErrorHandler);

// 4)START THE SERVER
module.exports = app;
