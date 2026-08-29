const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
  userId: { type: String, required: false }, // Store user ID for isolation
  title: { type: String, required: true },
  description: { type: String, required: true },
  industry: { type: String },
  horizon: { type: String },
  stakes: { type: String },

  documentInsights: { type: mongoose.Schema.Types.Mixed },
  framingAnalysis: { type: mongoose.Schema.Types.Mixed },
  
  decisionReadinessScore: { type: Number },

  generatedOptions: [{ type: String }],
  
  evaluation: { type: mongoose.Schema.Types.Mixed },
  
  recommendedOption: { type: String },

  status: {
    type: String,
    enum: ["Evaluated", "Implemented", "Outcome Recorded"],
    default: "Evaluated"
  },
  
  executiveJudgment: {
    disagrees: { type: Boolean },
    reason: { type: String, enum: ["Experience", "Political reality", "Market intuition", "Ethics", "Other", null] },
    explanation: { type: String }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Decision', DecisionSchema);
