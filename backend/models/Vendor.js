const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendor_name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
  },
  vendor_code: {
    type: String,
    required: [true, 'Vendor code is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  gst_number: {
    type: String,
    trim: true,
  },
  pan_number: {
    type: String,
    trim: true,
  },
  bank_details: {
    bank_name: String,
    account_number: String,
    ifsc_code: String,
    branch_name: String,
  },
  contact_person: {
    name: String,
    phone: String,
    designation: String,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'],
    default: 'ACTIVE',
  },
}, {
  timestamps: true,
});

vendorSchema.index({ vendor_code: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ vendor_name: 'text' });

module.exports = mongoose.model('Vendor', vendorSchema);
