const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
