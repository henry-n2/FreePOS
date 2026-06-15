const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity_purchased: { type: Number, required: true },
  item_cost_price: { type: Number, required: true },
  item_unit_price: { type: Number, required: true },
  discount_percent: { type: Number, default: 0 },
  description: { type: String, default: '' },
  serialnumber: { type: String, default: '' },
  location_id: { type: String, required: true }
}, { _id: false });

const SalePaymentSchema = new mongoose.Schema({
  payment_type: { type: String, required: true },
  payment_amount: { type: Number, required: true }
}, { _id: false });

const SaleTaxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percent: { type: Number, required: true }
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  sale_time: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  comment: { type: String, default: '' },
  invoice_number: { type: String, unique: true, sparse: true },
  payments: [SalePaymentSchema],
  items: [SaleItemSchema],
  taxes: [SaleTaxSchema],
  suspended: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
