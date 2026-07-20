const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    unique: true,
  },
  payment_reference: {
    type: String,
    unique: true,
    required: true,
  },
  utr_number: {
    type: String,
    unique: true,
    sparse: true,
  },
  payment_date: {
    type: Date,
    required: true,
  },
  payment_amount: {
    type: Number,
    required: true,
    min: 0,
  },
  payment_method: {
    type: String,
    enum: ['NEFT', 'RTGS', 'CHEQUE', 'DD', 'OTHER'],
    default: 'NEFT',
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  remarks: String,
}, {
  timestamps: true,
});

paymentSchema.index({ invoice_id: 1 });
paymentSchema.index({ payment_reference: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payment_date: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
