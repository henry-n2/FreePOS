const mongoose = require('mongoose');

const ItemKitItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const ItemKitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  item_kit_number: { type: String, unique: true, sparse: true },
  description: { type: String, default: '' },
  deleted: { type: Boolean, default: false },
  items: [ItemKitItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('ItemKit', ItemKitSchema);
