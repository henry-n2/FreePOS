const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getManage);
router.get('/search', customerController.getSearch);
router.get('/view/:id', customerController.getView);
router.post('/save/:id', customerController.postSave);
router.post('/delete', customerController.postDelete);
router.get('/suggest', customerController.getSuggest);

module.exports = router;
