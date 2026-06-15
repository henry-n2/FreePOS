const mongoose = require('mongoose');

const ReceivingItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity_purchased: { type: Number, required: true }, // negative if returned, positive if received
  item_cost_price: { type: Number, required: true },
  item_unit_price: { type: Number, required: true },
  discount_percent: { type: Number, default: 0 },
  description: { type: String, default: '' },
  serialnumber: { type: String, default: '' },
  location_id: { type: String, required: true }
}, { _id: false });

const ReceivingSchema = new mongoose.Schema({
  receiving_time: { type: Date, default: Date.now },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  comment: { type: String, default: '' },
  payment_type: { type: String, default: 'Cash' },
  reference: { type: String, default: '' },
  items: [ReceivingItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Receiving', ReceivingSchema);
