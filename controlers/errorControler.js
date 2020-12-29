const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  //console.log(value);
  const message = `Campo duplicado: ${value}, Por favor use otro valor`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); // para recorrer los errores y devolver un único mensaje de error
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, Logéate de nuevo!!', 401);

const handleJWTErrorExpired = () =>
  new AppError('El token ha cadaucado, Logéate de nuevo!!', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) WEB
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Algo ha salido mal!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // OPERATIONAL, errores confiables: enviar mensaje al cliente
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // ERRORES DE PROGRAMACIÓN o otros errores desconocidos: no enviar detalles del error
    // 1- Log error
    console.error('ERROR 💥', err);
    // 2- Enviar mensaje genérico
    return res.status(500).json({
      status: 'error',
      message: 'Algo muy malo ha pasado....',
    });
  }
  // WEB
  // OPERATIONAL, errores confiables: enviar mensaje al cliente
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Algo ha salido mal!',
      msg: err.message,
    });
  }
  // ERRORES DE PROGRAMACIÓN o otros errores desconocidos: no enviar detalles del error
  // 1- Log error
  console.error('ERROR 💥', err);
  // 2- Enviar mensaje genérico
  return res.status(err.statusCode).render('error', {
    title: 'Algo ha salido mal!',
    msg: 'Por favor inténtalo más tarde.',
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebToken') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTErrorExpired();

    sendErrorProd(error, req, res);
  }
};
