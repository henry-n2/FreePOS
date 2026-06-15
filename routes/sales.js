const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.getRegister);
router.post('/add', saleController.postAddItem);
router.post('/edit_item/:index', saleController.postEditItem);
router.get('/delete_item/:index', saleController.getDeleteItem);
router.post('/select_customer', saleController.postSelectCustomer);
router.get('/remove_customer', saleController.getRemoveCustomer);
router.post('/quick_add_customer', saleController.postQuickAddCustomer);
router.post('/add_payment', saleController.postAddPayment);
router.get('/delete_payment/:index', saleController.getDeletePayment);
router.post('/location', saleController.postLocation);
router.post('/cancel', saleController.postCancel);
router.post('/suspend', saleController.postSuspend);
router.get('/suspended', saleController.getSuspendedList);
router.get('/unsuspend/:id', saleController.getUnsuspend);
router.post('/complete', saleController.postComplete);
router.get('/receipt/:id', saleController.getReceipt);
router.get('/invoice/:id', saleController.getInvoice);

module.exports = router;
