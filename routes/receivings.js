const express = require('express');
const router = express.Router();
const receivingController = require('../controllers/receivingController');

router.get('/', receivingController.getRegister);
router.post('/add', receivingController.postAddItem);
router.post('/edit_item/:index', receivingController.postEditItem);
router.get('/delete_item/:index', receivingController.getDeleteItem);
router.post('/select_supplier', receivingController.postSelectSupplier);
router.get('/remove_supplier', receivingController.getRemoveSupplier);
router.post('/complete', receivingController.postComplete);
router.get('/receipt/:id', receivingController.getReceipt);
router.post('/cancel', receivingController.postCancel);
router.get('/suggest_suppliers', receivingController.getSuggestSuppliers);

module.exports = router;
