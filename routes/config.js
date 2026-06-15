const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/', configController.getManage);
router.post('/save', configController.postSave);

module.exports = router;
