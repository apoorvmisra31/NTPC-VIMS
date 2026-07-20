const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
  },
  is_internal: {
    type: Boolean,
    default: false,
  },
  is_system: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

commentSchema.index({ invoice_id: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
