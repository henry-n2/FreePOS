const express = require('express');
const router = express.Router();
const itemKitController = require('../controllers/itemKitController');

router.get('/', itemKitController.getManage);
router.get('/search', itemKitController.getSearch);
router.get('/view/:id', itemKitController.getView);
router.post('/save/:id', itemKitController.postSave);
router.post('/delete', itemKitController.postDelete);
router.get('/suggest', itemKitController.getSuggest);

module.exports = router;
