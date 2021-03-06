const express = require('express');
const tourCOntroler = require('../controlers/tourControler');
const authControler = require('../controlers/authControler');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
//router.param('id', tourCOntroler.checkID);

// NESTED ROUTES
// POST   URL : /tour/<tourId>/reviews
// GET    URL : /tour/<tourId>/reviews
router.use('/:tourId/reviews', reviewRouter); //son derivadas al reviewRouter

router
  .route('/top-5-cheap')
  .get(tourCOntroler.aliasTopTours, tourCOntroler.getAlltours);

router.route('/tour-stats').get(tourCOntroler.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authControler.protect,
    authControler.restricTo('admin', 'lead-guide', 'guide'),
    tourCOntroler.getMonthyPlan
  );

router.route('/distances/:latlng/unit/:unit').get(tourCOntroler.getDistances);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourCOntroler.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit/mi
// /tours-within/233/center/-40,45/unit/mi
router
  .route('/')
  .get(tourCOntroler.getAlltours)
  //.post(tourCOntroler.checkBody, tourCOntroler.createTour);
  .post(
    authControler.protect,
    authControler.restricTo('admin', 'lead-guide'),
    tourCOntroler.createTour
  );

router
  .route('/:id')
  .get(tourCOntroler.getTour)
  .patch(
    authControler.protect,
    authControler.restricTo('admin', 'lead-guide'),
    tourCOntroler.uploadTourImages,
    tourCOntroler.resizeTourImages,
    tourCOntroler.updateTour
  )
  .delete(
    authControler.protect,
    authControler.restricTo('admin', 'lead-guide'),
    tourCOntroler.deleteTour
  );

module.exports = router;
