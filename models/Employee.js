const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const GrantSchema = new mongoose.Schema({
  permission_id: {
    type: String,
    required: true
  },
  menu_group: {
    type: String,
    enum: ['home', 'office', 'both'],
    default: 'home'
  }
}, { _id: false });

const EmployeeSchema = new mongoose.Schema({
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  gender: { type: Number, default: 0 }, // 0: Male, 1: Female, etc.
  phone_number: { type: String, default: '' },
  email: { type: String, default: '' },
  address_1: { type: String, default: '' },
  address_2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  country: { type: String, default: '' },
  comments: { type: String, default: '' },
  
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'cashier', 'stocker'],
    default: 'cashier'
  },
  grants: [GrantSchema]
}, { timestamps: true });

// Pre-save hook to hash password if modified
EmployeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
EmployeeSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Employee', EmployeeSchema);
