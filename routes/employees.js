const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.get('/', employeeController.getManage);
router.get('/search', employeeController.getSearch);
router.get('/view/:id', employeeController.getView);
router.post('/save/:id', employeeController.postSave);
router.post('/delete', employeeController.postDelete);

module.exports = router;
