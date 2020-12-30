const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // user-id-timestamp.jpg
    const ext = file.mimetype.split('/')[1]; // con el [1] obtenemos el segundo elemento del array de resultado del split
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
}); */
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  // Se puede usar esto para todo tipo de archivos ... SVG, etc.
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'El archivo no es una imagen!!, por favor carge solamente imágenes.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next;

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);
/*exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});*/

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  // 1) crear un error si el usuario POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'Esta ruta no está autorizada para actualizar el password, por favor utilice la ruta correcta',
        400
      )
    );
  }

  // 2) Fitrar/Eliminar los campos no permitidos para actualizar
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    //añadimos la foto
    filteredBody.photo = req.file.filename;
  }

  // 3) Actualizar los datos del usuario
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // Sólo funciona para usuario logeados, por lo que podemos usar req.user.id
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'sucess',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message:
      'Create ruta no está implementada!! por favor use /signup en su lugar',
  });
};

exports.getUser = factory.getOne(User);

// no actualizar passwords con esto
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
