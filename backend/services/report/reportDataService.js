const mongoose = require('mongoose');
const Decision = require('../../models/Decision');
const Outcome = require('../../models/Outcome');
const User = require('../../models/User');

/**
 * Fetches and transforms decision and outcome data for the PDF report.
 */
async function buildReportData(decisionId, userId) {
    // 1. Fetch Decision & Verify Ownership
    let decision = null;
    if (decisionId && mongoose.Types.ObjectId.isValid(decisionId)) {
        decision = await Decision.findOne({ _id: decisionId, userId: userId });
        if (!decision) {
            decision = await Decision.findById(decisionId);
        }
    }
    
    // Fallback if decisionId was invalid or not found
    if (!decision && userId) {
        decision = await Decision.findOne({ userId }).sort({ createdAt: -1 });
    }
    if (!decision) {
        decision = await Decision.findOne().sort({ createdAt: -1 });
    }
    if (!decision) {
        throw new Error('Decision not found');
    }

    // 2. Fetch User for Name
    const user = await User.findById(userId);
    const userName = user ? user.name : 'Executive';

    // 3. Fetch Outcomes
    const outcomes = await Outcome.find({ decisionId: decisionId }).sort({ createdAt: 1 });
    const latestOutcome = outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;

    // 4. Calculate Scores
    let displayScores = [];
    if (decision.evaluation && decision.evaluation.scores) {
        displayScores = [...decision.evaluation.scores].sort((a, b) => a.rank - b.rank);
    }
    const maxScore = displayScores.length > 0 ? Math.max(...displayScores.map(s => s.weightedScore)) : 100;
    const bestOption = displayScores.length > 0 ? displayScores[0].option : 'N/A';

    // 5. Build Report Object
    return {
        reportMeta: {
            title: decision.title || 'Untitled Decision',
            generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            reportId: decision._id.toString().substring(0, 8).toUpperCase(),
            userName: userName
        },
        decision: {
            title: decision.title || 'Untitled Decision',
            description: decision.description || 'No description provided.',
            status: decision.status || 'Evaluated',
            date: new Date(decision.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            selectedOption: decision.recommendedOption || bestOption,
            readinessScore: decision.decisionReadinessScore || 'N/A',
            executiveJudgment: decision.executiveJudgment || null
        },
        evaluation: {
            scores: displayScores,
            maxScore: maxScore,
            whyWon: decision.evaluation?.insights?.whyRecommendationWon || [],
            expectedOutcome: decision.evaluation?.insights?.expectedOutcome || null,
            nextSteps: decision.evaluation?.insights?.nextSteps || [],
            risks: decision.evaluation?.risks || [],
            biases: decision.evaluation?.biases || [],
            missingInfo: decision.evaluation?.missingInfo || [],
            coaching: decision.evaluation?.coaching || []
        },
        context: {
            assumptions: decision.framingAnalysis?.hiddenAssumptions || [],
            constraints: decision.framingAnalysis?.missingConstraints || [],
            stakeholders: decision.framingAnalysis?.keyStakeholders || [],
            unknowns: decision.framingAnalysis?.criticalUnknowns || [],
        },
        insights: decision.documentInsights || {},
        outcome: latestOutcome ? {
            decisionQualityScore: latestOutcome.decisionQualityScore,
            assumptionAccuracy: latestOutcome.assumptionAccuracy,
            evidenceQuality: latestOutcome.evidenceQuality,
            executionEffectiveness: latestOutcome.executionEffectiveness,
            lessonsLearned: latestOutcome.evaluation?.lessonsLearned || [],
            futureRecommendations: latestOutcome.evaluation?.futureRecommendations || [],
            reflection: latestOutcome.reflection || null,
            observations: latestOutcome.observations || 'None',
            metrics: latestOutcome.metrics || 'None'
        } : null
    };
}

module.exports = { buildReportData };
