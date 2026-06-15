const mongoose = require('mongoose');

const StockLocationSchema = new mongoose.Schema({
  location_id: {
    type: String,
    required: true,
    unique: true
  },
  location_name: {
    type: String,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('StockLocation', StockLocationSchema);
