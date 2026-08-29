require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DIA_SYSTEM_PROMPT = `You are DIA. Maintain an executive tone.`; // Simplified for token limits

async function test() {
    const prompt = `You are a strategic decision evaluator.
Return ONLY valid raw JSON. No markdown. No explanation. NO SCRATCHPAD.
CRITICAL: Ensure all strings are properly escaped, there are NO trailing commas, and the JSON is perfectly well-formed and closed.

DECISION: Launch new EV
INDUSTRY: Auto
STAKES: High
CONTEXT: 

OPTIONS:
1. Acquire a regional competitor to gain market share
2. Form a joint venture with a technology firm
3. Optimize existing product distribution channels
4. Launch a completely new flagship product line

CRITERIA (name: weight%):
- Financial Impact: 30%
- Strategic Alignment: 40%
- Risk Level: 30%

Return this exact JSON structure:
{
  "scores": [{"option": "text", "criteriaScores": {"Financial Impact": 7, "Strategic Alignment": 7, "Risk Level": 7}, "weightedScore": 7.5, "rank": 1}],
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

    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: DIA_SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ],
        model: "openai/gpt-oss-20b",
        temperature: 0.7,
        max_tokens: 4000
    });
    console.log("LLM RAW OUTPUT LENGTH:", completion.choices[0].message.content.length);
    console.log("LLM FINISH REASON:", completion.choices[0].finish_reason);
    console.log("LLM RAW OUTPUT SNIPPET (LAST 500 CHARS):", completion.choices[0].message.content.slice(-500));
}

test().catch(console.error);
