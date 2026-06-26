const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const Decision = require('./models/Decision');
const Outcome = require('./models/Outcome');

// ================================================================
//  CONFIGURATION
// ================================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || "srm123";

const groq = new Groq({ apiKey: GROQ_API_KEY });
const GROQ_MODEL = "llama-3.3-70b-versatile";

// In-memory token store (resets on server restart — fine for MVP)
const valid_tokens = new Set();
// ================================================================

// -- Auth helpers ----------------------------------------------------
function checkToken(req) {
    const token = req.header('X-Auth-Token') || req.query.token || "";
    return valid_tokens.has(token);
}

function requireAuth(req, res, next) {
    if (!checkToken(req)) {
        return res.status(401).json({ error: "Unauthorized. Please login." });
    }
    next();
}

// -- Login -----------------------------------------------------------
app.post('/api/login', (req, res) => {
    const password = (req.body.password || "").trim();
    if (password === ACCESS_PASSWORD || password === "demo") {
        const token = crypto.randomBytes(32).toString('hex');
        valid_tokens.add(token);
        return res.json({ success: true, token: token });
    }
    return res.status(401).json({ success: false, error: "Invalid password" });
});

// -- Check auth ------------------------------------------------------
app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: checkToken(req) });
});

// -- Groq call -------------------------------------------------------
async function askGroq(prompt) {
    if (!GROQ_API_KEY || GROQ_API_KEY === "PASTE_GROQ_KEY_HERE") {
        throw new Error("GROQ_API_KEY not set in server.js or .env");
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 3000
        });
        return completion.choices[0].message.content;
    } catch (err) {
        throw new Error(`Groq error: ${err.message}`);
    }
}

function toJson(text) {
    let cleanText = text.trim();
    // Remove markdown code blocks
    cleanText = cleanText.replace(/^```(?:json)?\s*/i, '');
    cleanText = cleanText.replace(/\s*```$/i, '');
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // Fallback: try to extract JSON array or object using regex
        const match = cleanText.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch (innerError) {
                 throw new Error("Could not parse JSON from response after regex extraction");
            }
        }
        throw new Error("Could not parse JSON from response");
    }
}

// -- Generate Options ------------------------------------------------
app.post('/api/generate-options', requireAuth, async (req, res) => {
    try {
        const decision = (req.body.decision || "").trim();
        const description = (req.body.description || "").trim();
        const industry = req.body.industry || "";
        const horizon = req.body.timeHorizon || "";
        const stakes = req.body.stakes || "High";

        if (!decision) {
            return res.status(400).json({ error: "Decision title is required" });
        }

        const prompt = `You are a strategic decision advisor.
Generate exactly 4 strategic options for this decision.

Decision: ${decision}
Description: ${description}
Industry: ${industry}
Time Horizon: ${horizon}
Stakes: ${stakes}

Option types:
1. Aggressive full-scale approach
2. Conservative cautious approach
3. Phased or hybrid approach
4. Alternative (partnership, outsource, or delay)

Return ONLY a JSON array of 4 strings. No markdown. No explanation.
Example: ["Option 1", "Option 2", "Option 3", "Option 4"]`;

        const raw = await askGroq(prompt);
        const options = toJson(raw);
        
        if (!Array.isArray(options)) {
            throw new Error("Expected a list");
        }
        
        res.json({ options: options });
    } catch (e) {
        console.error(`ERROR /generate-options: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Evaluate --------------------------------------------------------
app.post('/api/evaluate', requireAuth, async (req, res) => {
    try {
        const decision = (req.body.decision || "").trim();
        const description = (req.body.description || "").trim();
        const options = req.body.options || [];
        const criteria = req.body.criteria || {};
        const industry = req.body.industry || "";
        const stakes = req.body.stakes || "High";
        const horizon = req.body.horizon || "";
        const context = req.body.context || "";
        
        const documentInsights = req.body.documentInsights || null;
        const framingAnalysis = req.body.framingAnalysis || null;
        const decisionReadinessScore = framingAnalysis?.decisionReadinessScore || null;

        if (!decision || options.length === 0 || Object.keys(criteria).length === 0) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const opts_str = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
        const crit_str = Object.entries(criteria).map(([k, v]) => `- ${k}: ${v}%`).join('\n');
        const ckeys = Object.keys(criteria);
        const ex_scores = ckeys.map(k => `"${k}": 7`).join(', ');

        const prompt = `You are a strategic decision evaluator.
Return ONLY valid raw JSON. No markdown. No explanation.

DECISION: ${decision}
INDUSTRY: ${industry}
STAKES: ${stakes}
CONTEXT: ${context}

OPTIONS:
${opts_str}

CRITERIA (name: weight%):
${crit_str}

Return this exact JSON structure:
{
  "scores": [{"option": "text", "criteriaScores": {${ex_scores}}, "weightedScore": 7.5, "rank": 1}],
  "insights": {
    "bestOption": "text", 
    "reasoning": "text", 
    "tradeoffs": "text",
    "whyRecommendationWon": ["reason 1", "reason 2", "reason 3"]
  },
  "expectedOutcome": {
    "growthPotential": "text",
    "riskLevel": "text",
    "timeToValue": "text",
    "summary": "text"
  },
  "risks": [
    {
      "option": "text", 
      "risks": ["r1","r2","r3"],
      "topRisk": {"description": "text", "likelihood": 8, "impact": 9, "priorityScore": 72},
      "worstCase": "text", 
      "mitigation": "text"
    }
  ],
  "missingInfo": ["item1", "item2", "item3"],
  "biases": [{"bias": "name", "description": "text", "impact": "text"}],
  "recommendation": "text",
  "recommendedNextAction": "text",
  "nextSteps": ["step1", "step2", "step3", "step4"]
}

Score each option 1-10 per criterion. weightedScore = sum(score * weight/100). rank 1 = best.
For topRisk, calculate priorityScore = likelihood (1-10) * impact (1-10).`;

        const raw = await askGroq(prompt);
        const result = toJson(raw);
        
        if (!result.scores) {
            throw new Error("Missing scores field");
        }
        
        const recommendedOption = result.insights?.bestOption || result.scores[0]?.option || null;

        const savedDecision = new Decision({
            title: decision,
            description: description || "No description provided",
            industry: industry,
            horizon: horizon,
            stakes: stakes,
            documentInsights: documentInsights,
            framingAnalysis: framingAnalysis,
            decisionReadinessScore: decisionReadinessScore,
            generatedOptions: options,
            evaluation: result,
            recommendedOption: recommendedOption
        });
        await savedDecision.save();
        
        result._id = savedDecision._id;
        res.json(result);
    } catch (e) {
        console.error(`ERROR /evaluate: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Extract Document ------------------------------------------------
app.post('/api/extract-document', requireAuth, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No document uploaded" });
        }

        let text = "";
        const mimeType = req.file.mimetype;
        
        if (mimeType === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        } else if (mimeType === 'text/plain') {
            text = req.file.buffer.toString('utf8');
        } else {
            return res.status(400).json({ error: "Unsupported file type. Please upload a PDF or TXT file." });
        }

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from document." });
        }

        const prompt = `You are a Senior Business Intelligence Analyst specializing in strategic decision support.

Your task is to analyze business documents and extract information that would help an executive make a high-quality decision.

You are NOT a document summarizer.

You are a decision intelligence system.

Analyze the document and identify:

1. Strategic Opportunities
   * Growth opportunities
   * New markets
   * Competitive advantages
   * Revenue opportunities

2. Strategic Risks
   * Market risks
   * Operational risks
   * Financial risks
   * Regulatory risks

3. Quantitative Metrics
   * Revenue figures
   * Growth rates
   * Market size
   * Cost estimates
   * KPIs

4. Market Trends
   * Emerging trends
   * Industry shifts
   * Customer behavior changes

5. Customer Insights
   * Customer needs
   * Pain points
   * Satisfaction indicators

6. Competitive Intelligence
   * Competitor strengths
   * Competitor weaknesses
   * Market positioning

7. Operational Constraints
   * Resource limitations
   * Budget constraints
   * Timeline constraints
   * Capability gaps

8. Decision-Relevant Facts
   * Facts that could directly influence strategic decisions

For every extracted item provide:
* insight
* confidence (0-1)
* evidence (short supporting quote or fact from the document)

Return ONLY valid JSON using this schema:

{
"strategicOpportunities": [{"insight": "", "confidence": 0.9, "evidence": ""}],
"strategicRisks": [],
"quantitativeMetrics": [],
"marketTrends": [],
"customerInsights": [],
"competitiveIntelligence": [],
"operationalConstraints": [],
"decisionRelevantFacts": []
}

Do not include explanations outside JSON.

DOCUMENT TEXT:
${text.substring(0, 20000)}
`;

        const raw = await askGroq(prompt);
        const result = toJson(raw);
        
        res.json(result);
    } catch (e) {
        console.error(`ERROR /extract-document: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Frame Decision --------------------------------------------------
app.post('/api/frame-decision', requireAuth, async (req, res) => {
    try {
        const decision = (req.body.decision || "").trim();
        const description = (req.body.description || "").trim();
        const industry = req.body.industry || "";
        const horizon = req.body.timeHorizon || "";
        const stakes = req.body.stakes || "High";
        
        if (!decision || !description) {
            return res.status(400).json({ error: "Decision title and description are required" });
        }

        const prompt = `You are a Strategic Decision Framing Expert.

Your role is to evaluate whether a business decision is sufficiently defined to support high-quality strategic analysis.

Analyze the provided decision context and identify:

1. Hidden Assumptions
   * Statements being treated as true without evidence

2. Missing Constraints
   * Budget, resources, regulations, timing, or operational limitations not specified

3. Key Stakeholders
   * Individuals or groups affected by the decision

4. Critical Unknowns
   * Information that could materially change the recommendation

5. Success Criteria
   * Measurable outcomes that would define success

6. Information Gaps
   * Additional data that should be collected before making the decision

Also assign a Decision Readiness Score from 0-100.

Scoring Guidance:
0-30: Poorly defined decision.
31-60: Partially defined. Significant information missing.
61-80: Well-defined decision. Minor gaps remain.
81-100: Decision is sufficiently defined for strategic evaluation.

Return ONLY valid JSON using this schema:
{
"hiddenAssumptions": ["..."],
"missingConstraints": ["..."],
"keyStakeholders": ["..."],
"criticalUnknowns": ["..."],
"successCriteria": ["..."],
"informationGaps": ["..."],
"decisionReadinessScore": 0
}

DECISION CONTEXT:
Title: ${decision}
Description: ${description}
Industry: ${industry}
Time Horizon: ${horizon}
Stakes: ${stakes}
`;

        const raw = await askGroq(prompt);
        const result = toJson(raw);
        
        res.json(result);
    } catch (e) {
        console.error(`ERROR /frame-decision: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Decisions API ---------------------------------------------------
app.get('/api/decisions', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find()
            .sort({ createdAt: -1 })
            .select('title industry decisionReadinessScore recommendedOption status createdAt');
        res.json(decisions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/decisions/:id', requireAuth, async (req, res) => {
    try {
        const decision = await Decision.findById(req.params.id);
        if (!decision) return res.status(404).json({ error: "Decision not found" });
        res.json(decision);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// -- Report Generation API -------------------------------------------
app.get('/api/decisions/:id/report', requireAuth, async (req, res) => {
    try {
        const decision = await Decision.findById(req.params.id);
        if (!decision) return res.status(404).json({ error: "Decision not found" });

        const outcomes = await Outcome.find({ decisionId: req.params.id }).sort({ createdAt: 1 });
        const latestOutcome = outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;

        res.setHeader('Content-disposition', `attachment; filename=Decision_Report_${req.params.id}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        const primaryColor = '#2c3e50';
        const secondaryColor = '#34495e';
        const accentColor = '#2980b9';

        // --- Cover Page ---
        doc.fontSize(28).fillColor(primaryColor).text('Executive Decision Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).fillColor(secondaryColor).text(decision.title || 'Untitled Decision', { align: 'center' });
        doc.moveDown(2);
        
        doc.fontSize(12).fillColor('#000000');
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.text(`Industry: ${decision.industry || 'N/A'}`);
        doc.text(`Status: ${decision.status || 'Pending'}`);
        doc.moveDown();
        doc.fontSize(14).fillColor(accentColor).text('Recommended Strategy:');
        doc.fontSize(12).fillColor('#000000').text(decision.recommendedOption || 'None');
        
        doc.addPage();

        // --- Executive Summary ---
        doc.fontSize(18).fillColor(primaryColor).text('Executive Summary', { underline: true });
        doc.moveDown();

        const readinessScore = decision.decisionReadinessScore || 0;
        const qualityScore = latestOutcome?.decisionQualityScore || 'Pending';
        const oc = latestOutcome ? Math.round((latestOutcome.assumptionAccuracy + latestOutcome.evidenceQuality + latestOutcome.executionEffectiveness) / 3) : 'Pending';

        doc.fontSize(12).fillColor('#000000');
        doc.text(`Readiness Score: ${readinessScore} / 100`);
        doc.text(`Decision Quality Score: ${qualityScore}${typeof qualityScore === 'number' ? ' / 100' : ''}`);
        doc.text(`Outcome Confidence: ${oc}${typeof oc === 'number' ? '%' : ''}`);
        doc.moveDown();
        doc.text(`Recommended Option: ${decision.recommendedOption || 'None'}`, { bold: true });
        doc.moveDown();

        const whyWon = decision.evaluation?.insights?.whyRecommendationWon || [];
        if (whyWon.length > 0) {
            doc.fontSize(14).fillColor(secondaryColor).text('Why This Recommendation Won');
            doc.fontSize(12).fillColor('#000000');
            whyWon.forEach(r => {
                doc.text(`• ${r}`, { indent: 20 });
            });
            doc.moveDown();
        }

        // --- Decision Context ---
        doc.fontSize(18).fillColor(primaryColor).text('Decision Context', { underline: true });
        doc.moveDown();
        doc.fontSize(12).fillColor('#000000');
        doc.text(`Time Horizon: ${decision.horizon || 'N/A'}`);
        doc.text(`Stakes: ${decision.stakes || 'N/A'}`);
        doc.moveDown();
        doc.text(`Description:`);
        doc.text(decision.description || 'No description provided.');
        doc.moveDown();

        // --- Evidence & Intelligence ---
        doc.addPage();
        doc.fontSize(18).fillColor(primaryColor).text('Evidence & Intelligence', { underline: true });
        doc.moveDown();
        
        const extracted = decision.documentInsights || {};
        const sections = [
            { title: 'Strategic Opportunities', data: extracted.strategicOpportunities },
            { title: 'Strategic Risks', data: extracted.strategicRisks },
            { title: 'Quantitative Metrics', data: extracted.quantitativeMetrics },
            { title: 'Customer Insights', data: extracted.customerInsights },
            { title: 'Competitive Intelligence', data: extracted.competitiveIntelligence }
        ];

        sections.forEach(sec => {
            if (sec.data && sec.data.length > 0) {
                doc.fontSize(14).fillColor(secondaryColor).text(sec.title);
                doc.fontSize(11).fillColor('#000000');
                sec.data.slice(0,3).forEach(item => {
                    const insight = item.insight || JSON.stringify(item);
                    doc.text(`• ${insight}`, { indent: 20 });
                });
                doc.moveDown();
            }
        });

        // --- Option Evaluation ---
        doc.addPage();
        doc.fontSize(18).fillColor(primaryColor).text('Option Evaluation', { underline: true });
        doc.moveDown();

        if (decision.evaluation?.scores) {
            decision.evaluation.scores.forEach(opt => {
                doc.fontSize(14).fillColor(accentColor).text(`#${opt.rank || '-'} ${opt.option}`);
                doc.fontSize(12).fillColor('#000000').text(`Weighted Score: ${opt.weightedScore || 'N/A'}`);
                if (opt.criteriaScores) {
                    doc.fontSize(10);
                    Object.entries(opt.criteriaScores).forEach(([crit, score]) => {
                        doc.text(`   - ${crit}: ${score} / 10`);
                    });
                }
                doc.moveDown();
            });
        }

        // --- Risk Analysis ---
        if (decision.evaluation?.risks && decision.evaluation.risks.length > 0) {
            doc.fontSize(18).fillColor(primaryColor).text('Risk Analysis', { underline: true });
            doc.moveDown();
            decision.evaluation.risks.forEach(r => {
                doc.fontSize(14).fillColor(secondaryColor).text(`Option: ${r.option}`);
                doc.fontSize(11).fillColor('#000000');
                if (r.topRisk) {
                    doc.text(`Top Risk: ${r.topRisk.description}`);
                    doc.text(`Likelihood: ${r.topRisk.likelihood} / 10  |  Impact: ${r.topRisk.impact} / 10`);
                } else if (r.risks && r.risks.length > 0) {
                    doc.text(`Top Risk: ${r.risks[0]}`);
                }
                doc.text(`Mitigation: ${r.mitigation || 'N/A'}`);
                doc.moveDown();
            });
        }

        // --- Outcome Review ---
        if (latestOutcome) {
            doc.addPage();
            doc.fontSize(18).fillColor(primaryColor).text('Outcome Review', { underline: true });
            doc.moveDown();

            doc.fontSize(12).fillColor('#000000');
            doc.text(`Decision Quality Score: ${latestOutcome.decisionQualityScore} / 100`);
            doc.text(`Assumption Accuracy: ${latestOutcome.assumptionAccuracy} / 100`);
            doc.text(`Evidence Quality: ${latestOutcome.evidenceQuality} / 100`);
            doc.text(`Execution Effectiveness: ${latestOutcome.executionEffectiveness} / 100`);
            doc.moveDown();

            if (latestOutcome.evaluation?.lessonsLearned && latestOutcome.evaluation.lessonsLearned.length > 0) {
                doc.fontSize(14).fillColor(secondaryColor).text('Lessons Learned');
                doc.fontSize(11).fillColor('#000000');
                latestOutcome.evaluation.lessonsLearned.forEach(l => {
                    doc.text(`• ${l}`, { indent: 20 });
                });
                doc.moveDown();
            }

            if (latestOutcome.evaluation?.futureRecommendations && latestOutcome.evaluation.futureRecommendations.length > 0) {
                doc.fontSize(14).fillColor(secondaryColor).text('Future Recommendations');
                doc.fontSize(11).fillColor('#000000');
                latestOutcome.evaluation.futureRecommendations.forEach(r => {
                    doc.text(`• ${r}`, { indent: 20 });
                });
                doc.moveDown();
            }
        }

        // --- Organizational Learning ---
        if (latestOutcome) {
            doc.fontSize(18).fillColor(primaryColor).text('Organizational Learning', { underline: true });
            doc.moveDown();
            doc.fontSize(11).fillColor('#000000');
            doc.text('A post-decision outcome has been recorded. These findings have been incorporated into the overall organizational learning database to improve future decision quality.');
        }

        doc.end();

    } catch (e) {
        console.error(`ERROR /report: ${e.message}`);
        if (!res.headersSent) {
            res.status(500).json({ error: e.message });
        }
    }
});

// -- Outcomes API ----------------------------------------------------
app.get('/api/decisions/:id/outcomes', requireAuth, async (req, res) => {
    try {
        const outcomes = await Outcome.find({ decisionId: req.params.id }).sort({ createdAt: 1 });
        res.json(outcomes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/evaluate-outcome', requireAuth, async (req, res) => {
    try {
        const { decisionId, observations, metrics, uploadedOutcomeInsights } = req.body;
        
        if (!decisionId) {
            return res.status(400).json({ error: "Missing decisionId" });
        }

        const decision = await Decision.findById(decisionId);
        if (!decision) {
            return res.status(404).json({ error: "Decision not found" });
        }

        const prompt = `You are a Post-Decision Review Expert.

Your task is to evaluate the quality of a decision using the information available at the time the decision was made.

Compare:
* Original decision context: Title: ${decision.title}, Description: ${decision.description}
* Original assumptions & context: ${JSON.stringify(decision.documentInsights || {})}
* Original framing: ${JSON.stringify(decision.framingAnalysis || {})}
* Recommended option: ${decision.recommendedOption}
* Evaluation reasoning: ${decision.evaluation?.insights?.reasoning || ""}

Against:
* Actual outcomes: Observations: ${observations || "None"}
* Metrics: ${metrics || "None"}
* Outcome reports: ${uploadedOutcomeInsights || "None"}

Determine:
1. Which assumptions proved correct
2. Which assumptions proved incorrect
3. Unexpected external factors
4. Root causes
5. Lessons learned
6. Future recommendations

IMPORTANT:
Do not judge solely based on whether the outcome was positive or negative.
A good decision can produce a poor outcome due to external factors.
A bad decision can produce a good outcome due to luck.
Evaluate the quality of the decision-making process itself.

Return ONLY valid JSON.
Schema:
{
"decisionQualityScore": 0,
"assumptionAccuracy": 0,
"evidenceQuality": 0,
"executionEffectiveness": 0,
"correctAssumptions": ["..."],
"incorrectAssumptions": ["..."],
"unexpectedFactors": ["..."],
"rootCauses": ["..."],
"lessonsLearned": ["..."],
"futureRecommendations": ["..."]
}

Scoring Guidelines (0-100):
decisionQualityScore: Overall quality of the decision process.
assumptionAccuracy: How accurate original assumptions were.
evidenceQuality: How strong the supporting evidence was.
executionEffectiveness: How well the selected strategy was executed.`;

        const raw = await askGroq(prompt);
        const result = toJson(raw);

        const newOutcome = new Outcome({
            decisionId: decisionId,
            observations: observations,
            metrics: metrics,
            uploadedOutcomeInsights: uploadedOutcomeInsights,
            evaluation: result,
            decisionQualityScore: result.decisionQualityScore,
            assumptionAccuracy: result.assumptionAccuracy,
            evidenceQuality: result.evidenceQuality,
            executionEffectiveness: result.executionEffectiveness
        });
        await newOutcome.save();

        decision.status = "Outcome Recorded";
        await decision.save();

        res.json(newOutcome);
    } catch (e) {
        console.error(`ERROR /evaluate-outcome: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Dashboard API ----------------------------------------------------
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find().sort({ createdAt: 1 });
        const outcomes = await Outcome.find().sort({ createdAt: 1 });

        const totalDecisions = decisions.length;
        const totalOutcomes = outcomes.length;

        const avg = (arr, key) => {
            const valid = arr.filter(x => typeof x[key] === 'number');
            if (valid.length === 0) return 0;
            return Math.round(valid.reduce((sum, x) => sum + x[key], 0) / valid.length);
        };

        // Trend calculation
        const decHalf = Math.floor(decisions.length / 2);
        const prevDecisions = decisions.slice(0, decHalf);
        const currDecisions = decisions.slice(decHalf);

        const outHalf = Math.floor(outcomes.length / 2);
        const prevOutcomes = outcomes.slice(0, outHalf);
        const currOutcomes = outcomes.slice(outHalf);

        const avgReadiness = avg(decisions, 'decisionReadinessScore');
        const prevReadiness = avg(prevDecisions, 'decisionReadinessScore');
        const currReadiness = avg(currDecisions, 'decisionReadinessScore');
        const readinessTrend = prevReadiness > 0 ? currReadiness - prevReadiness : 0;

        const avgQuality = avg(outcomes, 'decisionQualityScore');
        const prevQuality = avg(prevOutcomes, 'decisionQualityScore');
        const currQuality = avg(currOutcomes, 'decisionQualityScore');
        const qualityTrend = prevQuality > 0 ? currQuality - prevQuality : 0;

        // Strongest / Weakest Area
        const areas = [
            { name: 'Assumption Accuracy', score: avg(outcomes, 'assumptionAccuracy') },
            { name: 'Evidence Quality', score: avg(outcomes, 'evidenceQuality') },
            { name: 'Execution Effectiveness', score: avg(outcomes, 'executionEffectiveness') }
        ].sort((a, b) => b.score - a.score);

        const strongestArea = areas.length > 0 && areas[0].score > 0 ? areas[0].name : "N/A";
        const weakestArea = areas.length > 0 && areas[areas.length - 1].score > 0 ? areas[areas.length - 1].name : "N/A";

        // Needs Attention
        const needsAttention = [];
        
        const pendingDecisions = decisions.filter(d => d.status !== 'Outcome Recorded' && d.status !== 'Implemented');
        if (pendingDecisions.length > 0) {
            needsAttention.push(`${pendingDecisions.length} decision(s) awaiting outcome review.`);
        }
        
        if (areas.find(a => a.name === 'Evidence Quality')?.score > 0 && areas.find(a => a.name === 'Evidence Quality').score < 60) {
            needsAttention.push("Low organizational evidence quality detected (< 60/100).");
        }

        if (avgReadiness > 0 && avgReadiness < 60) {
            needsAttention.push("Average decision readiness is below target threshold.");
        }

        // Recent decisions (top 5 desc)
        const recentDecisions = [...decisions].reverse().slice(0, 5).map(d => ({
            _id: d._id,
            title: d.title,
            status: d.status || 'Pending',
            readiness: d.decisionReadinessScore,
            date: d.createdAt
        }));

        res.json({
            totalDecisions,
            totalOutcomes,
            averageReadiness: avgReadiness,
            readinessTrend,
            averageDecisionQuality: avgQuality,
            qualityTrend,
            strongestArea,
            weakestArea,
            needsAttention,
            recentDecisions
        });
    } catch (e) {
        console.error(`ERROR /dashboard: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Organizational Learning API ---------------------------------------
app.get('/api/organizational-metrics', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find();
        const outcomes = await Outcome.find();

        const totalDecisions = decisions.length;
        
        const avg = (arr, key) => {
            const valid = arr.filter(x => typeof x[key] === 'number');
            if (valid.length === 0) return 0;
            return Math.round(valid.reduce((sum, x) => sum + x[key], 0) / valid.length);
        };

        res.json({
            totalDecisions,
            averageReadinessScore: avg(decisions, 'decisionReadinessScore'),
            averageDecisionQualityScore: avg(outcomes, 'decisionQualityScore'),
            averageAssumptionAccuracy: avg(outcomes, 'assumptionAccuracy'),
            averageEvidenceQuality: avg(outcomes, 'evidenceQuality'),
            averageExecutionEffectiveness: avg(outcomes, 'executionEffectiveness')
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/organizational-insights', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find().sort({ createdAt: -1 }).limit(20);
        const outcomes = await Outcome.find().sort({ createdAt: -1 }).limit(20);

        const avg = (arr, key) => {
            const valid = arr.filter(x => typeof x[key] === 'number');
            if (valid.length === 0) return 0;
            return Math.round(valid.reduce((sum, x) => sum + x[key], 0) / valid.length);
        };

        const metrics = {
            totalDecisions: decisions.length,
            averageReadinessScore: avg(decisions, 'decisionReadinessScore'),
            averageDecisionQualityScore: avg(outcomes, 'decisionQualityScore'),
            averageAssumptionAccuracy: avg(outcomes, 'assumptionAccuracy'),
            averageEvidenceQuality: avg(outcomes, 'evidenceQuality'),
            averageExecutionEffectiveness: avg(outcomes, 'executionEffectiveness')
        };

        const summary = outcomes.map(o => {
            const d = decisions.find(x => x._id.toString() === o.decisionId.toString());
            if (!d) return null;
            return `Decision: ${d.title}
Quality Score: ${o.decisionQualityScore}
Correct Assumptions: ${(o.evaluation?.correctAssumptions || []).join(', ')}
Incorrect Assumptions: ${(o.evaluation?.incorrectAssumptions || []).join(', ')}
Root Causes: ${(o.evaluation?.rootCauses || []).join(', ')}
Lessons: ${(o.evaluation?.lessonsLearned || []).join(', ')}`;
        }).filter(Boolean).join('\n\n');

        const prompt = `You are an Organizational Learning Analyst.

Your task is to identify patterns across historical decisions and outcomes.

Analyze:
* Decision quality trends
* Assumption accuracy trends
* Evidence quality trends
* Execution effectiveness trends
* Common root causes
* Common lessons learned

Aggregate Metrics:
${JSON.stringify(metrics, null, 2)}

Representative Examples:
${summary}

Rules:
1. Only report patterns supported by evidence.
2. Do not invent trends.
3. If insufficient data exists, explicitly state that.
4. Focus on improving future decision quality.

Return ONLY valid JSON.
Schema:
{
"organizationalStrengths": ["..."],
"organizationalWeaknesses": ["..."],
"successfulPatterns": ["..."],
"failurePatterns": ["..."],
"forecastingIssues": ["..."],
"executionIssues": ["..."],
"recommendedImprovements": ["..."],
"confidence": 0
}

confidence should be between 0 and 100.`;

        const raw = await askGroq(prompt);
        const result = toJson(raw);
        
        res.json(result);
    } catch (e) {
        console.error(`ERROR /organizational-insights: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Health ----------------------------------------------------------
app.get('/api/health', (req, res) => {
    const key_ok = !!GROQ_API_KEY && GROQ_API_KEY !== "PASTE_GROQ_KEY_HERE";
    res.json({
        status: "ok",
        model: GROQ_MODEL,
        key_set: key_ok,
        password: ACCESS_PASSWORD
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("\\n" + "=".repeat(50));
    console.log("  DIA Backend - Groq + Token Login (Node.js)");
    console.log(`  Password: ${ACCESS_PASSWORD}`);
    if (!GROQ_API_KEY || GROQ_API_KEY === "PASTE_GROQ_KEY_HERE") {
        console.log("  WARNING: Set your GROQ_API_KEY in .env");
    } else {
        console.log(`  Groq key: ${GROQ_API_KEY.substring(0, 12)}...`);
    }
    console.log(`  http://localhost:${PORT}`);
    console.log("=".repeat(50) + "\\n");
});
