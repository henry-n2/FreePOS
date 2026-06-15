const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/', expenseController.getManage);
router.get('/search', expenseController.getSearch);
router.get('/view/:id', expenseController.getView);
router.post('/save/:id', expenseController.postSave);
router.post('/delete', expenseController.postDelete);

// Category routes
router.get('/categories', expenseController.getCategories);
router.post('/categories/save/:id', expenseController.postSaveCategory);
router.post('/categories/delete', expenseController.postDeleteCategory);

module.exports = router;
