const express = require('express');
const reviewControler = require('../controlers/reviewControler');
const authControler = require('../controlers/authControler');

const router = express.Router({ mergeParams: true });
// Por defecto cada ruta solo tiene acceso a los parámetros de su ruta específica,
// así que para tener acceso al tourId en el otro enrutador usamos mergeParams

// POST   /tour/<tourId>/reviews
// POST   /reviews
// these routes will all end up in this handler

router.use(authControler.protect);

router
  .route('/')
  .get(reviewControler.getAllReviews)
  .post(
    authControler.restricTo('user'),
    reviewControler.setTourUserIds,
    reviewControler.createReview
  );

router
  .route('/:id')
  .get(reviewControler.getReview)
  .patch(authControler.restricTo('admin', 'user'), reviewControler.updateReview)
  .delete(
    authControler.protect,
    authControler.restricTo('admin', 'user'),
    reviewControler.deleteReview
  );

module.exports = router;
