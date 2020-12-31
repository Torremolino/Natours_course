const express = require('express');
const userControler = require('../controlers/userControler');
const authControler = require('../controlers/authControler');

const router = express.Router();

router.post('/signup', authControler.signup);
router.post('/login', authControler.login);
router.get('/logout', authControler.logout);

router.post('/forgotPassword', authControler.forgotPassword);
router.patch('/resetPassword/:token', authControler.resetPassword);

// con esto protejo todas las rutas que aparecen debajo de este punto
// este middleware se ejecuta antes que los siguientes. los middleware se ejecutan de forma secuencial
router.use(authControler.protect);

router.patch('/updateMyPassword', authControler.updatePassword);

router.get('/me', userControler.getMe, userControler.getUser);
router.patch(
  '/updateMe',
  userControler.uploadUserPhoto,
  userControler.resizeUserPhoto,
  userControler.updateMe
);
router.delete('/deleteMe', userControler.deleteMe);

// rutas sólo permitidas para los administradores
router.use(authControler.restricTo('admin'));

router.route('/').get(userControler.getAllUsers).post(userControler.createUser);
router
  .route('/:id')
  .get(userControler.getUser)
  .patch(userControler.updateUser)
  .delete(userControler.deleteUser);

module.exports = router;
