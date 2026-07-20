const mongoose = require('mongoose');

const workflowTaskSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  assigned_role: {
    type: String,
    enum: ['VPD', 'EIC', 'VPG', 'FINANCE'],
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'SKIPPED'],
    default: 'PENDING',
  },
  action_taken: {
    type: String,
    enum: ['APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED', 'FORWARDED', 'HELD', 'EXCEPTION'],
  },
  comments: String,
  actor_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  completed_at: Date,
}, {
  timestamps: true,
});

workflowTaskSchema.index({ invoice_id: 1, status: 1 });
workflowTaskSchema.index({ assigned_role: 1, status: 1 });
workflowTaskSchema.index({ actor_user_id: 1 });

module.exports = mongoose.model('WorkflowTask', workflowTaskSchema);
