const express = require('express');
const router = express.Router();
const giftcardController = require('../controllers/giftcardController');

router.get('/', giftcardController.getManage);
router.get('/search', giftcardController.getSearch);
router.get('/view/:id', giftcardController.getView);
router.post('/save/:id', giftcardController.postSave);
router.post('/delete', giftcardController.postDelete);
router.get('/suggest', giftcardController.getSuggest);

module.exports = router;
