const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

router.get('/', supplierController.getManage);
router.get('/search', supplierController.getSearch);
router.get('/view/:id', supplierController.getView);
router.post('/save/:id', supplierController.postSave);
router.post('/delete', supplierController.postDelete);

module.exports = router;
