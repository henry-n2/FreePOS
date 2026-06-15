const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  gender: { type: Number, default: 0 },
  phone_number: { type: String, default: '' },
  email: { type: String, default: '' },
  address_1: { type: String, default: '' },
  address_2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  country: { type: String, default: '' },
  comments: { type: String, default: '' },

  company_name: { type: String, required: true },
  agency_name: { type: String, default: '' },
  account_number: { type: String, unique: true, sparse: true },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
