const mongoose = require('mongoose');

const OutcomeSchema = new mongoose.Schema({
  decisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Decision', required: true },
  
  observations: { type: String },
  metrics: { type: String },
  uploadedOutcomeInsights: { type: String },
  
  evaluation: { type: mongoose.Schema.Types.Mixed },
  
  decisionQualityScore: { type: Number },
  assumptionAccuracy: { type: Number },
  evidenceQuality: { type: Number },
  executionEffectiveness: { type: Number },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Outcome', OutcomeSchema);
