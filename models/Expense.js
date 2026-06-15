const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, default: 0 },
  payment_type: { type: String, default: 'Cash' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  description: { type: String, default: '' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
