const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestId: {
    type: String
  },
  company: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: false
  },
  experience: {
    type: String,
    required: true
  },
  rounds: [{
    roundName: {
      type: String,
      required: true
    },
    questions: [{
      type: String
    }],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    outcome: {
      type: String,
      enum: ['Cleared', 'Rejected', 'Pending'],
      default: 'Pending'
    }
  }],
  projectGithub: String,
  resumeLink: String,
  instagram: String,
  linkedIn: String,
  questions: [{
    type: String
  }],
  tips: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  outcome: {
    type: String,
    enum: ['Selected', 'Rejected', 'Pending'],
    default: 'Pending'
  },
  interviewDate: {
    type: Date
  },
  upvotes: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    guestId: String,
    name: String,
    text: {
      type: String,
      required: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Interview', InterviewSchema);