const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['vendor', 'vpd', 'eic', 'vpg', 'finance', 'hr_admin', 'system_admin', 'vendor_sub_user'],
    required: true,
    default: 'vendor',
  },
  vendorCode: {
    type: String,
    sparse: true,
    trim: true,
  },
  vendorName: {
    type: String,
    trim: true,
  },
  companyName: {
    type: String,
    trim: true,
  },
  gstin: {
    type: String,
    trim: true,
  },
  panNumber: {
    type: String,
    trim: true,
  },
  contactPerson: {
    name: String,
    designation: String,
    phone: String,
  },
  bankDetails: [{
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
    accountType: { type: String, enum: ['Savings', 'Current'] },
    isPrimary: { type: Boolean, default: false },
  }],
  plant: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVendorAdmin: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
  },
  parentVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ vendorCode: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
