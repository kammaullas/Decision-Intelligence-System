const mongoose = require('mongoose');

const DecisionDNASchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true
  },
  decisionStyle: { 
    type: String,
    trim: true,
    required: true
  },
  strategicThinking: { type: Number, min: 1, max: 10 },
  analyticalThinking: { type: Number, min: 1, max: 10 },
  innovationOrientation: { type: Number, min: 1, max: 10 },
  stakeholderOrientation: { type: Number, min: 1, max: 10 },
  riskTolerance: { type: Number, min: 1, max: 10 },
  executionUrgency: { type: Number, min: 1, max: 10 },
  ethicalOrientation: { type: Number, min: 1, max: 10 },
  consensusOrientation: { type: Number, min: 1, max: 10 },
  
  strengths: [{ type: String, trim: true }],
  blindSpots: [{ type: String, trim: true }],
  coachingAdvice: [{ type: String, trim: true }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DecisionDNA', DecisionDNASchema);
