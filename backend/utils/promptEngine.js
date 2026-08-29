/**
 * Formats a user and their DecisionDNA into a standardized LLM context block.
 * Handles missing fields and missing DNA profiles gracefully.
 */
function buildExecutiveProfileContext(user, decisionDNA) {
  if (!user) return "";

  let context = `Executive Profile\n`;
  context += `Role: ${user.designation || 'Executive'} at ${user.organisation || 'Organization'} (${user.industry || 'Industry'})\n`;

  if (!decisionDNA) {
    return context; // If no DNA exists yet, return just the basic executive profile
  }

  context += `\nDecision Style:\n${decisionDNA.decisionStyle || 'Not assessed'}\n`;

  if (decisionDNA.strengths && decisionDNA.strengths.length > 0) {
    context += `\nStrengths:\n- ${decisionDNA.strengths.join('\n- ')}\n`;
  }

  if (decisionDNA.blindSpots && decisionDNA.blindSpots.length > 0) {
    context += `\nBlind Spots:\n- ${decisionDNA.blindSpots.join('\n- ')}\n`;
  }

  if (decisionDNA.coachingAdvice && decisionDNA.coachingAdvice.length > 0) {
    context += `\nLeadership Advice:\n- ${decisionDNA.coachingAdvice.join('\n- ')}\n`;
  }

  context += `\nRisk Orientation:\n${decisionDNA.riskTolerance || 'N/A'}\n`;
  context += `\nAnalytical Orientation:\n${decisionDNA.analyticalThinking || 'N/A'}\n`;
  context += `\nStakeholder Orientation:\n${decisionDNA.stakeholderOrientation || 'N/A'}\n`;
  context += `\nInnovation Orientation:\n${decisionDNA.innovationOrientation || 'N/A'}\n`;
  context += `\nExecution Urgency:\n${decisionDNA.executionUrgency || 'N/A'}\n`;
  context += `\nEthical Orientation:\n${decisionDNA.ethicalOrientation || 'N/A'}\n`;
  context += `\nConsensus Orientation:\n${decisionDNA.consensusOrientation || 'N/A'}\n`;

  return context;
}

module.exports = {
  buildExecutiveProfileContext
};
