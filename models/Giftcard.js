const mongoose = require('mongoose');

const GiftcardSchema = new mongoose.Schema({
  giftcard_number: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Giftcard', GiftcardSchema);
