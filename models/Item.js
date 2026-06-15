const mongoose = require('mongoose');

const ItemTaxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percent: { type: Number, required: true }
}, { _id: false });

const ItemQuantitySchema = new mongoose.Schema({
  location_id: { type: String, required: true }, // e.g. 'stock' or MongoDB ID of StockLocation
  quantity: { type: Number, default: 0 }
}, { _id: false });

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  item_number: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  cost_price: { type: Number, required: true, default: 0 },
  unit_price: { type: Number, required: true, default: 0 },
  reorder_level: { type: Number, default: 0 },
  receiving_quantity: { type: Number, default: 1 },
  pic_filename: { type: String, default: '' },
  allow_alt_description: { type: Boolean, default: false },
  is_serialized: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  
  custom: {
    custom1: { type: String, default: '' },
    custom2: { type: String, default: '' },
    custom3: { type: String, default: '' },
    custom4: { type: String, default: '' },
    custom5: { type: String, default: '' },
    custom6: { type: String, default: '' },
    custom7: { type: String, default: '' },
    custom8: { type: String, default: '' },
    custom9: { type: String, default: '' },
    custom10: { type: String, default: '' }
  },

  taxes: [ItemTaxSchema],
  quantities: [ItemQuantitySchema]
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
