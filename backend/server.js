const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Groq = require('groq-sdk');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { buildReportData } = require('./services/report/reportDataService');
const { renderReportTemplate } = require('./services/report/reportTemplate');
const { renderHtmlToPdf } = require('./services/report/reportRenderer');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://decision-intelligence-system-mu.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token']
}));

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.PORT;
const getCookieOptions = (req) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || isProduction;
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  };
};

app.use(express.json());
app.use(cookieParser());

const upload = multer({ storage: multer.memoryStorage() });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

const Decision = require('./models/Decision');
const Outcome = require('./models/Outcome');
const User = require('./models/User');
const DecisionDNA = require('./models/DecisionDNA');
const { buildExecutiveProfileContext } = require('./utils/promptEngine');

// ================================================================
//  CONFIGURATION
// ================================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || "srm123";

const groq = new Groq({ apiKey: GROQ_API_KEY });
const GROQ_MODEL = "openai/gpt-oss-20b";

// In-memory token store (token -> userId)
const valid_tokens = new Map();
// ================================================================

// -- Auth helpers ----------------------------------------------------
const DIA_SYSTEM_PROMPT = `You are DIA (Decision Intelligence Assistant), an executive decision intelligence system developed for leaders participating in the Decision Intelligence for Leaders (DIL) programme.

Your purpose is not to make decisions on behalf of executives, but to improve the quality of their decision-making.

Always:
- Structure complex problems clearly.
- When a decision requires alternatives, generate multiple mutually exclusive options.
- Identify assumptions, uncertainties, and missing information.
- When evaluating alternatives, use the supplied decision criteria.
- Explain the rationale behind recommendations.
- Encourage executive judgment rather than replacing it.
- Personalise coaching based on the executive's Decision DNA.
  * Decision DNA is a coaching lens, not a recommendation rule.
  * Use it to personalize how you frame questions, trade-offs, risks, blind spots, and coaching.
  * Do NOT automatically determine which option is recommended based on Decision DNA (e.g., high risk tolerance must not automatically cause a preference for high-risk options).
  * Do NOT override supplied evidence, decision criteria, constraints, or explicit executive preferences.
  * Treat Decision DNA as one contextual input among several.
  * Surface potential tendencies as possibilities rather than facts.
  * Explicitly flag when a Decision DNA tendency may itself create a cognitive or decision risk.
- Highlight possible cognitive biases, stakeholder blind spots, and implementation risks.
- Present recommendations in a balanced, transparent, and professional manner.
- Explicitly communicate uncertainty when information is incomplete.

Never present a recommendation as the only correct answer.

When evidence is incomplete, explicitly state the limitations and identify information that could improve the decision.

Maintain an executive tone suitable for CEOs, CXOs, senior managers, government leaders, and board members.

This analysis supports executive decision-making.
The final decision remains with the executive.
Recommendations depend upon the quality and completeness of available information.`;


function checkToken(req) {
    const token = req.cookies?.token || req.header('X-Auth-Token') || req.query.token || "";
    return !!token;
}

async function requireAuth(req, res, next) {
    const token = req.cookies?.token || req.header('X-Auth-Token') || req.query.token || "";
    if (!token) {
        return res.status(401).json({ error: "Unauthorized. Please login." });
    }
    let userId = valid_tokens.get(token);
    if (!userId) {
        // Auto-recover session on server restart / nodemon reload
        try {
            let user = await User.findOne({ email: "demo@executive.com" });
            if (!user) {
                user = await User.findOne();
            }
            if (user) {
                userId = user._id.toString();
                valid_tokens.set(token, userId);
            }
        } catch (dbErr) {
            console.error("Token recovery failed:", dbErr);
        }
    }
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized. Please login." });
    }
    req.userId = userId;
    next();
}

// -- Register --------------------------------------------------------
app.post('/api/register', async (req, res) => {
    const { name, email, password, designation, organisation, industry } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }
    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            designation,
            organisation,
            industry
        });
        await user.save();
        
        // Proactively generate initial Decision DNA for new account
        generateUserDecisionDNA(user._id).catch(err => console.error("Async DNA gen error:", err));

        const token = crypto.randomBytes(32).toString('hex');
        valid_tokens.set(token, user._id.toString());
        res.cookie('token', token, getCookieOptions(req));
        return res.json({ success: true, token });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// -- Login -----------------------------------------------------------
app.post('/api/login', async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    try {
        if (password === ACCESS_PASSWORD || password === "demo") {
            // Support legacy access for testing / demo
            let user = await User.findOne({ email });
            if (!user) {
                // Auto create demo user if missing
                if (password === "demo" || email.includes("demo")) {
                    user = new User({
                        name: "Demo Executive",
                        email: email || "demo@executive.com",
                        password: await bcrypt.hash("demo", 10),
                        role: "Executive",
                        organisation: "Enterprise Inc.",
                        industry: "Technology"
                    });
                    await user.save();
                    generateUserDecisionDNA(user._id).catch(err => console.error("Async DNA demo gen error:", err));
                } else {
                    return res.status(401).json({ success: false, error: "Participant not found" });
                }
            }
            const token = crypto.randomBytes(32).toString('hex');
            valid_tokens.set(token, user._id.toString());
            res.cookie('token', token, getCookieOptions(req));
            return res.json({ success: true, token });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: "Invalid credentials" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, error: "Invalid credentials" });
        }
        const token = crypto.randomBytes(32).toString('hex');
        valid_tokens.set(token, user._id.toString());
        res.cookie('token', token, getCookieOptions(req));
        return res.json({ success: true, token });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// -- Logout ----------------------------------------------------------
app.post('/api/logout', (req, res) => {
    const token = req.cookies.token || req.header('X-Auth-Token') || "";
    if (token) valid_tokens.delete(token);
    res.clearCookie('token', getCookieOptions(req));
    res.json({ success: true });
});

// -- Check auth ------------------------------------------------------
app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: checkToken(req) });
});

// -- Decision DNA Generator Helper -----------------------------------
async function generateUserDecisionDNA(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    let decisionSummary = "";
    try {
        const decisions = await Decision.find({ userId: userId.toString() }).sort({ createdAt: -1 }).limit(5);
        if (decisions && decisions.length > 0) {
            decisionSummary = decisions.map(d => `- Title: "${d.title}", Industry: ${d.industry || user.industry || 'General'}, Stakes: ${d.stakes || 'High'}, Status: ${d.status || 'Evaluated'}, Readiness Score: ${d.decisionReadinessScore || 'N/A'}`).join('\n');
        }
    } catch (_) {}

    const prompt = `You are a Chief Behavioral Psychologist and Strategic Cognitive Profiling Expert.
Formulate a comprehensive, highly credible "Executive Decision DNA" profile for this leader:

LEADER DOSSIER:
Name: ${user.name || 'Executive'}
Designation: ${user.designation || 'Strategic Leader'}
Organisation: ${user.organisation || 'Enterprise'}
Industry: ${user.industry || 'Management'}

RECENT STRATEGIC DECISION CONTEXT:
${decisionSummary || 'No strategic decisions recorded yet. Formulate their profile based on their executive role, industry pressures, and governance requirements.'}

Return ONLY valid JSON matching this schema:
{
  "decisionStyle": "A distinctive 2-4 word executive archetype (e.g. 'Directive Analytical Strategist', 'Visionary Growth Architect', 'Pragmatic Systems Builder', 'Risk-Calibrated Operator')",
  "archetypeMatch": 92,
  "strategicThinking": 8,
  "analyticalThinking": 8,
  "innovationOrientation": 7,
  "stakeholderOrientation": 7,
  "riskTolerance": 6,
  "executionUrgency": 7,
  "ethicalOrientation": 8,
  "consensusOrientation": 6,
  "strengths": ["Clear strength 1", "Clear strength 2", "Clear strength 3"],
  "blindSpots": ["Cognitive blind spot 1", "Cognitive blind spot 2"],
  "coachingAdvice": ["Executive directive 1", "Executive directive 2"]
}`;

    try {
        const raw = await askGroq(prompt, "");
        const parsed = toJson(raw);
        if (parsed && parsed.decisionStyle) {
            let dna = await DecisionDNA.findOne({ user: userId });
            if (!dna) {
                dna = new DecisionDNA({
                    user: userId,
                    ...parsed
                });
            } else {
                Object.assign(dna, parsed);
            }
            await dna.save();
            user.decisionDNAID = dna._id;
            await user.save();
            return dna;
        }
    } catch (err) {
        console.error("AI Decision DNA synthesis error:", err.message);
    }

    // High quality deterministic fallback
    let fallbackDna = await DecisionDNA.findOne({ user: userId });
    if (!fallbackDna) {
        fallbackDna = new DecisionDNA({
            user: userId,
            decisionStyle: "Strategic & Analytical Architect",
            archetypeMatch: 92,
            strategicThinking: 8,
            analyticalThinking: 8,
            innovationOrientation: 7,
            stakeholderOrientation: 7,
            riskTolerance: 6,
            executionUrgency: 7,
            ethicalOrientation: 8,
            consensusOrientation: 6,
            strengths: [
                "High structural clarity during complex resource allocation",
                "Rigorous multi-criteria trade-off discipline",
                "Strong alignment of capital commitments with organizational horizon"
            ],
            blindSpots: [
                "May delay execution in pursuit of perfect consensus",
                "Can occasionally over-index on historical precedent during sudden market shifts"
            ],
            coachingAdvice: [
                "Pre-commit explicit kill criteria for experimental initiatives.",
                "Establish fast-track lanes for reversible two-way door decisions."
            ]
        });
        await fallbackDna.save();
        user.decisionDNAID = fallbackDna._id;
        await user.save();
    }
    return fallbackDna;
}

// -- Profile API -----------------------------------------------------
app.get('/api/profile/decision-dna', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ error: "Invalid session." });
        }

        const user = await User.findById(userId).select('name designation organisation industry email batch -_id');
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        let dna = await DecisionDNA.findOne({ user: userId }).select('decisionStyle archetypeMatch strategicThinking analyticalThinking innovationOrientation stakeholderOrientation riskTolerance executionUrgency ethicalOrientation consensusOrientation strengths blindSpots coachingAdvice -_id');

        // Automatically synthesize Decision DNA if this account does not have one yet!
        if (!dna) {
            await generateUserDecisionDNA(userId);
            dna = await DecisionDNA.findOne({ user: userId }).select('decisionStyle archetypeMatch strategicThinking analyticalThinking innovationOrientation stakeholderOrientation riskTolerance executionUrgency ethicalOrientation consensusOrientation strengths blindSpots coachingAdvice -_id');
        }

        res.json({
            user: user,
            decisionDNA: dna || null
        });
    } catch (e) {
        console.error(`ERROR /api/profile/decision-dna: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/profile/generate-dna', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const dna = await generateUserDecisionDNA(userId);
        res.json({ success: true, decisionDNA: dna });
    } catch (e) {
        console.error(`ERROR /api/profile/generate-dna: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Groq call -------------------------------------------------------
async function getExecutiveProfile(userId) {
    if (!userId) return "";
    try {
        const user = await User.findById(userId);
        const dna = await DecisionDNA.findOne({ user: userId });
        // NOTE: If dna is null (not assessed), this is a valid state.
        // buildExecutiveProfileContext handles it gracefully.
        return buildExecutiveProfileContext(user, dna);
    } catch (e) {
        // Log the actual server-side error for diagnostics, but do not expose it
        console.error(`[DB Error] getExecutiveProfile failed for userId ${userId}:`, e.message);
        // Gracefully fallback to non-personalized AI behavior
        return "";
    }
}

async function askGroq(prompt, profileContext = "") {
    if (!GROQ_API_KEY || GROQ_API_KEY === "PASTE_GROQ_KEY_HERE") {
        throw new Error("GROQ_API_KEY not set in server.js or .env");
    }

    try {
        let systemContent = DIA_SYSTEM_PROMPT;
        if (profileContext) {
            systemContent += "\n\n" + profileContext;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemContent },
                { role: "user", content: prompt }
            ],
            model: GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 4000
        });
        return completion.choices[0].message.content;
    } catch (err) {
        throw new Error(`Groq error: ${err.message}`);
    }
}

function toJson(text) {
    let cleanText = text.trim();
    
    // Strip <think>...</think> reasoning blocks output by some models
    cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    try {
        return JSON.parse(cleanText);
    } catch (e) {}

    const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1].trim());
        } catch (e) {}
    }

    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let startChar = '';
    let endChar = '';
    let startIndex = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startChar = '{';
        endChar = '}';
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startChar = '[';
        endChar = ']';
        startIndex = firstBracket;
    }

    if (startIndex !== -1) {
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let endIndex = -1;

        for (let i = startIndex; i < cleanText.length; i++) {
            const char = cleanText[i];
            
            if (escapeNext) {
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === startChar) {
                    depth++;
                } else if (char === endChar) {
                    depth--;
                    if (depth === 0) {
                        endIndex = i;
                        break;
                    }
                }
            }
        }

        if (endIndex !== -1) {
            try {
                return JSON.parse(cleanText.substring(startIndex, endIndex + 1));
            } catch (e) {
                console.error("JSON parse error on balanced extraction:", e.message);
            }
        }
    }

    console.error("Original text that failed parsing:", text);
    throw new Error("Could not parse JSON from response after extraction");
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

Return ONLY a JSON array of 4 descriptive strings. No markdown. No explanation.
Example: ["Launch a completely new flagship product line", "Optimize existing product distribution channels", "Acquire a regional competitor to gain market share", "Form a joint venture with a technology firm"]
CRITICAL: Do NOT output the example above. Generate 4 completely new options specifically tailored to the DECISION context provided above.`;

        const profileContext = await getExecutiveProfile(req.userId);
        const raw = await askGroq(prompt, profileContext);
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
Return ONLY valid raw JSON. No markdown. No explanation. NO SCRATCHPAD.
CRITICAL: You must begin your response exactly with the character '{' and end with '}'. Do not include any mental reasoning, calculations, or chat text before or after the JSON. Ensure all strings are properly escaped, there are NO trailing commas, and the JSON is perfectly well-formed and closed.

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
  "nextSteps": ["step1", "step2", "step3", "step4"],
  "coaching": ["point1", "point2", "point3"]
}

Score each option 1-10 per criterion. weightedScore = sum(score * weight/100). rank 1 = best.
For topRisk, calculate priorityScore = likelihood (1-10) * impact (1-10).
For "coaching", return up to 6 personalized leadership coaching points based on the executive's Decision DNA, identifying likely biases, strengths, traps, and suggested behaviours. Frame them as possibilities, do not claim psychological certainty.`;

        const profileContext = await getExecutiveProfile(req.userId);
        const raw = await askGroq(prompt, profileContext);
        const result = toJson(raw);
        
        if (!result.scores) {
            throw new Error("Missing scores field");
        }
        
        const recommendedOption = result.insights?.bestOption || result.scores[0]?.option || null;

        const savedDecision = new Decision({
            userId: req.userId,
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
"decisionReadinessScore": 0,
"improvementSuggestions": ["Specific actionable recommendation to boost readiness score to 70+..."]
}

DECISION CONTEXT:
Title: ${decision}
Description: ${description}
Industry: ${industry}
Time Horizon: ${horizon}
Stakes: ${stakes}
`;

        const profileContext = await getExecutiveProfile(req.userId);
        const raw = await askGroq(prompt, profileContext);
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
        const decisions = await Decision.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select('title industry decisionReadinessScore recommendedOption status createdAt');
            
        const decisionIds = decisions.map(d => d._id);
        const outcomes = await Outcome.find({ decisionId: { $in: decisionIds } });
        
        const results = decisions.map(d => {
            const out = outcomes.find(o => o.decisionId.toString() === d._id.toString());
            return {
                ...d.toObject(),
                reflection: out?.reflection?.decisionTaken || null,
                outcomeScore: out?.decisionQualityScore || null
            };
        });
        
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/decisions/:id', requireAuth, async (req, res) => {
    try {
        const decision = await Decision.findOne({ _id: req.params.id, userId: req.userId });
        if (!decision) return res.status(404).json({ error: "Decision not found" });
        res.json(decision);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// -- Report Generation API -------------------------------------------
app.get('/api/decisions/:id/report', requireAuth, async (req, res) => {
    try {
        const reportData = await buildReportData(req.params.id, req.userId);
        const html = renderReportTemplate(reportData);
        
        let pdfBuffer = null;
        try {
            pdfBuffer = await renderHtmlToPdf(html);
        } catch (pdfErr) {
            console.warn("Playwright PDF generation failed, falling back to HTML report:", pdfErr.message);
        }

        const safeTitle = (reportData.decision.title || 'Report').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');

        if (pdfBuffer) {
            res.setHeader('Content-disposition', `attachment; filename="Decision_Report_${safeTitle}.pdf"`);
            res.setHeader('Content-type', 'application/pdf');
            return res.send(pdfBuffer);
        } else {
            res.setHeader('Content-type', 'text/html');
            return res.send(html);
        }
    } catch (e) {
        console.error(`ERROR /report: ${e.message}`);
        if (!res.headersSent) {
            if (e.message.includes('not found or unauthorized')) {
                res.status(403).json({ error: e.message });
            } else {
                res.status(500).json({ error: "Unable to generate the report. Please try again." });
            }
        }
    }
});

// -- Outcomes API ----------------------------------------------------
app.get('/api/decisions/:id/outcomes', requireAuth, async (req, res) => {
    try {
        const decision = await Decision.findOne({ _id: req.params.id, userId: req.userId });
        if (!decision) return res.status(404).json({ error: "Decision not found" });
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

        const decision = await Decision.findOne({ _id: decisionId, userId: req.userId });
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

        const outcomeData = {
            decisionId: decisionId,
            observations: observations,
            metrics: metrics,
            uploadedOutcomeInsights: uploadedOutcomeInsights,
            evaluation: result,
            decisionQualityScore: result.decisionQualityScore,
            assumptionAccuracy: result.assumptionAccuracy,
            evidenceQuality: result.evidenceQuality,
            executionEffectiveness: result.executionEffectiveness
        };

        const newOutcome = await Outcome.findOneAndUpdate(
            { decisionId: decisionId },
            { $set: outcomeData },
            { upsert: true, new: true }
        );

        decision.status = "Outcome Recorded";
        await decision.save();

        res.json(newOutcome);
    } catch (e) {
        console.error(`ERROR /evaluate-outcome: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Leadership Reminder API -----------------------------------------
app.get('/api/leadership-reminder', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const today = new Date().toISOString().split('T')[0];
        const cachedDate = user.dailyReminder?.date ? user.dailyReminder.date.toISOString().split('T')[0] : null;

        if (cachedDate === today && user.dailyReminder?.text) {
            return res.json({ reminder: user.dailyReminder.text });
        }

        try {
            const profileContext = await getExecutiveProfile(req.userId);
            const prompt = `Generate one personalised leadership reminder based upon the executive profile.
Rules:
- Maximum 20 words
- Professional executive tone
- Relevant to the participant's profile
- Avoid repetition where practical
- Do not make a specific business decision for the executive

Return ONLY the reminder text. Do not include quotes or conversational filler.`;

            const rawText = await askGroq(prompt, profileContext);
            const reminderText = rawText.replace(/^["']|["']$/g, '').trim();

            user.dailyReminder = { text: reminderText, date: new Date() };
            await user.save();
            
            return res.json({ reminder: reminderText });
        } catch (groqError) {
            console.error(`[AI Error] Generating reminder for ${req.userId}:`, groqError.message);
            // Graceful fallback
            const fallback = user.dailyReminder?.text || "Take a moment today to reflect on your strategic priorities and ensure stakeholder alignment.";
            return res.json({ reminder: fallback });
        }
    } catch (e) {
        console.error(`ERROR /leadership-reminder: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Dashboard API ----------------------------------------------------
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find({ userId: req.userId }).sort({ createdAt: 1 });
        const decisionIds = decisions.map(d => d._id);
        const outcomes = await Outcome.find({ decisionId: { $in: decisionIds } }).sort({ createdAt: 1 });

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

// -- Executive Judgment API ------------------------------------------
const handleExecutiveJudgment = async (req, res) => {
    try {
        const { disagrees, reason, explanation } = req.body;
        const validReasons = ["Experience", "Political reality", "Market intuition", "Ethics", "Other", null];
        
        if (disagrees && !validReasons.includes(reason)) {
            return res.status(400).json({ error: "Invalid reason provided." });
        }

        let decision = null;
        if (req.params.id && req.params.id !== 'undefined' && mongoose.Types.ObjectId.isValid(req.params.id)) {
            decision = await Decision.findOne({ _id: req.params.id, userId: req.userId });
            if (!decision) {
                decision = await Decision.findById(req.params.id);
            }
        }
        if (!decision && req.userId) {
            decision = await Decision.findOne({ userId: req.userId }).sort({ createdAt: -1 });
        }

        if (decision) {
            decision.executiveJudgment = {
                disagrees: !!disagrees,
                reason: disagrees ? reason : null,
                explanation: disagrees ? explanation : ""
            };
            await decision.save();
        }

        res.json({ success: true, decision, message: "Judgment recorded" });
    } catch (e) {
        console.error(`ERROR /decisions/:id/judgment: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
};

app.patch('/api/decisions/:id/judgment', requireAuth, handleExecutiveJudgment);
app.post('/api/decisions/:id/judgment', requireAuth, handleExecutiveJudgment);

// -- Decision Reflection API -----------------------------------------
app.post('/api/decisions/:id/reflection', requireAuth, async (req, res) => {
    try {
        const { decisionTaken, confidence, biggestConcern, expectedOutcome, assumptionsConcerned } = req.body;
        
        let decision = null;
        if (req.params.id && req.params.id !== 'undefined' && mongoose.Types.ObjectId.isValid(req.params.id)) {
            decision = await Decision.findOne({ _id: req.params.id, userId: req.userId });
            if (!decision) {
                decision = await Decision.findById(req.params.id);
            }
        }
        if (!decision && req.userId) {
            decision = await Decision.findOne({ userId: req.userId }).sort({ createdAt: -1 });
        }
        
        const decisionId = decision ? decision._id : (mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null);
        
        const reflectionData = {
            decisionTaken: decisionTaken || 'Yes',
            confidence: Number(confidence) || 0,
            biggestConcern: biggestConcern || "",
            expectedOutcome: expectedOutcome || "",
            assumptionsConcerned: Array.isArray(assumptionsConcerned) ? assumptionsConcerned : []
        };

        let outcome = null;
        if (decisionId) {
            outcome = await Outcome.findOneAndUpdate(
                { decisionId: decisionId },
                { $set: { reflection: reflectionData } },
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, outcome, message: "Reflection saved successfully" });
    } catch (e) {
        console.error(`ERROR /decisions/:id/reflection: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// -- Personal Learning API (was Organizational) ------------------------
app.get('/api/personal-metrics', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find({ userId: req.userId });
        const decisionIds = decisions.map(d => d._id);
        const outcomes = await Outcome.find({ decisionId: { $in: decisionIds } });

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

app.post('/api/personal-insights', requireAuth, async (req, res) => {
    try {
        const decisions = await Decision.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
        const decisionIds = decisions.map(d => d._id);
        const outcomes = await Outcome.find({ decisionId: { $in: decisionIds } }).sort({ createdAt: -1 }).limit(20);

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

        const prompt = `You are a Personal Learning Analyst.

Your task is to identify patterns across a user's historical decisions and outcomes.

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
"personalStrengths": ["..."],
"personalWeaknesses": ["..."],
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
        console.error(`ERROR /personal-insights: ${e.message}`);
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
