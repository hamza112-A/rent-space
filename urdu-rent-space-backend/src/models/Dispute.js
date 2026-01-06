const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  // Reference Information
  disputeId: {
    type: String,
    unique: true
  },
  
  // Parties Involved
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Complainant is required']
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Respondent is required']
  },
  
  // Related Resources
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  
  // Dispute Details
  category: {
    type: String,
    enum: [
      'payment_issue',
      'property_condition',
      'cancellation_dispute',
      'damage_claim',
      'refund_request',
      'behavior_issue',
      'safety_concern',
      'fraudulent_activity',
      'breach_of_terms',
      'other'
    ],
    required: [true, 'Dispute category is required']
  },
  
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and Resolution
  status: {
    type: String,
    enum: [
      'submitted',
      'under_review',
      'investigating',
      'awaiting_response',
      'resolved',
      'closed',
      'escalated'
    ],
    default: 'submitted'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Admin Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Resolution Details
  resolution: {
    decision: String,
    explanation: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    action: {
      type: String,
      enum: [
        'refund_issued',
        'warning_given',
        'account_suspended',
        'booking_cancelled',
        'compensation_provided',
        'no_action',
        'mediation_required',
        'other'
      ]
    }
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['complainant', 'respondent', 'admin', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    attachments: [{
      type: String,
      url: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }]
  }],
  
  // Respondent Response
  respondentResponse: {
    submitted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date,
    response: String,
    evidence: [{
      type: String,
      url: String,
      description: String
    }]
  },
  
  // Timeline
  timeline: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Closure
  closedAt: Date,
  closureReason: String,
  
  // Metadata
  requestedAmount: {
    type: Number,
    min: 0
  },
  awardedAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Flags
  requiresUrgentAttention: {
    type: Boolean,
    default: false
  },
  
  internalNotes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate unique dispute ID before saving
disputeSchema.pre('save', async function(next) {
  if (!this.disputeId) {
    const count = await mongoose.model('Dispute').countDocuments();
    this.disputeId = `DSP-${Date.now()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Add to timeline automatically on status change
disputeSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      action: `Status changed to ${this.status}`,
      performedBy: this.assignedTo,
      timestamp: new Date()
    });
  }
  next();
});

// Indexes for faster queries
disputeSchema.index({ complainant: 1, createdAt: -1 });
disputeSchema.index({ respondent: 1, createdAt: -1 });
disputeSchema.index({ assignedTo: 1, status: 1 });
disputeSchema.index({ status: 1, priority: 1 });
disputeSchema.index({ disputeId: 1 });
disputeSchema.index({ booking: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
