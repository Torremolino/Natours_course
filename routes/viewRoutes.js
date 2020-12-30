const express = require('express');
const viewsContoller = require('../controlers/viewsControler');
const authController = require('../controlers/authControler');
//const bookingController = require('../controlers/bookingControler');

const router = express.Router();

//router.use(authController.isLoggedIn); lo pasamos a cada una de las rutas xq en /me duplicariamos los controles

router.get('/', authController.isLoggedIn, viewsContoller.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsContoller.getTour);
router.get('/login', authController.isLoggedIn, viewsContoller.getLoginForm);
router.get('/me', authController.protect, viewsContoller.getAccount);
router.get(
  '/my-tours',
  // bookingController.createBookingCheckout, //colocamos esto aquí temporalmente xq esta es la ruta de compra succesfuly hasta que no tengamos el webhook configurado
  authController.protect,
  viewsContoller.getMyTours
);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsContoller.updateUserData
);

module.exports = router;
