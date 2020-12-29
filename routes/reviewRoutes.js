const express = require('express');
const reviewControler = require('../controlers/reviewControler');
const authControler = require('../controlers/authControler');

const router = express.Router({ mergeParams: true });

// POST /tours/5efcdb0197b61e10d03e9d41/reviews
// GET /tours/5efcdb0197b61e10d03e9d41/reviews

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
