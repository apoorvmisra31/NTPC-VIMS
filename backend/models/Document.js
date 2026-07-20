const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  file_type: {
    type: String,
    enum: ['INVOICE_PDF', 'SUPPORTING_DOC', 'INSPECTION_REPORT', 'MEASUREMENT_BOOK', 'OTHER'],
    required: true,
  },
  file_name: {
    type: String,
    required: true,
  },
  original_name: String,
  file_url: {
    type: String,
    required: true,
  },
  file_size: Number,
}, {
  timestamps: true,
});

documentSchema.index({ invoice_id: 1 });
documentSchema.index({ file_type: 1 });

module.exports = mongoose.model('Document', documentSchema);
