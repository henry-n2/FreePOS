const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getInput);
router.get('/generate', reportController.getReport);

module.exports = router;
