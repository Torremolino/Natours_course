const express = require('express');
const viewsContoller = require('../controlers/viewsControler');

const router = express.Router();

router.get('/', viewsContoller.getOverview);
router.get('/tour/:slug', viewsContoller.getTour);
router.get('/login', viewsContoller.getLoginForm);

module.exports = router;
