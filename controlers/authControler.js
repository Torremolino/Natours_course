const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIERES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers('x-forwarderd-proto') === 'hpps', // Cambiado para heroku
  };

  //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; --> Cambiado para heroku
  res.cookie('jwt', token, cookieOptions);

  //Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  //console.log(url);
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) comprobar si email and password existe
  if (!email || !password) {
    return next(
      new AppError('Por favor indique un email y un password correctos', 400)
    );
  }

  //2) comprobar si el usuario existe y el password es correcto
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Password o email incorrectos', 401));
  }

  //3) si todo es correcto, enviar token al cliente

  createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Comprobar si existe algún token
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'No estás logeado!! Por favor logéate para acceder Mendrugo....',
        401
      )
    );
  }

  // 2) Comprobar si el token es válido
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Comprobar si el usuario todavía existe
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('El usuario no existe!!!', 401));
  }

  // 4) Comprobar si el usuario ha cambiado el password desde que se generó el token
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password incorrecto, por favor logéate de nuevo!!!', 401)
    );
  }

  // OTORGAR ACCESO A LA RUTA PROTEGIDA - GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Sólo para renderizar páginas, no habrá errores de retorno!!!
exports.isLoggedIn = async (req, res, next) => {
  // 1) Comprobar si existe algún token. El token siempre vendrá desde una cookie
  if (req.cookies.jwt) {
    try {
      // 2) Comprobar si el token es válido
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Comprobar si el usuario todavía existe
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4)Comprobar si el usuario ha cambiado el password desde que se generó el token
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // EL USUARIO ESTÁ LOGGEADO
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restricTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array []
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'No tienes los permisos necesarios para acceder aquí!!!',
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Tomar el usuario basandonos en el email que nos han pasado
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('El usuario no existe!!', 404));
  }
  // 2) Generar un ramdon token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // Guardamos la fecha de expire

  // 3) Enviarlo al email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    /* const message = `Forgot your password? Submit a PATCH request with your new password an passworConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!!`;
    await Email({
      email: user.email,
      subject: 'Your password reset token (válido por 5 minutos)',
      message,
    }); */

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token enviado al email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Ha surgido algo enviando el email. Por favor intentelo más tarde',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, //aqui comprobamos también si el token está caducado
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token inválido o caducado', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT

  createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from the collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if the POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('El password actual es erróneo!!!!', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log the user in, send JWT
  createAndSendToken(user, 200, req, res);
});
