const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', itemController.getManage);
router.get('/search', itemController.getSearch);
router.get('/view/:id', itemController.getView);
router.post('/save/:id', upload.single('item_image'), itemController.postSave);
router.post('/delete', itemController.postDelete);
router.get('/inventory/:id', itemController.getInventory);
router.post('/inventory/:id', itemController.postInventory);
router.get('/suggest', itemController.getSuggest);
router.get('/export', itemController.getExport);
router.post('/import', upload.single('csv_file'), itemController.postImport);
router.get('/bulk_barcodes', itemController.getBulkBarcodes);

module.exports = router;
