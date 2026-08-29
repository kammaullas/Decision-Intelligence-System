const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  designation: { 
    type: String,
    trim: true
  },
  organisation: { 
    type: String,
    trim: true
  },
  industry: { 
    type: String,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  batch: { 
    type: String,
    trim: true
  },
  assessmentCompleted: { 
    type: Boolean, 
    default: false 
  },
  decisionDNAID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DecisionDNA' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  dailyReminder: {
    text: { type: String },
    date: { type: Date }
  }
});

module.exports = mongoose.model('User', UserSchema);
