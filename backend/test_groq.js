require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

async function test() {
    const prompt = `You are a strategic decision advisor.
Generate exactly 4 strategic options for this decision.

Decision: Test Decision
Description: We need to enter the EV market.
Industry: Auto
Time Horizon: 2 years
Stakes: High

Option types:
1. Aggressive full-scale approach
2. Conservative cautious approach
3. Phased or hybrid approach
4. Alternative (partnership, outsource, or delay)

Return ONLY a JSON array of 4 descriptive strings. No markdown. No explanation.
Example: ["Launch a completely new flagship product line", "Optimize existing product distribution channels", "Acquire a regional competitor to gain market share", "Form a joint venture with a technology firm"]
CRITICAL: Do NOT output the example above. Generate 4 completely new options specifically tailored to the DECISION context provided above.`;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: DIA_SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ],
        model: "qwen/qwen3.6-27b",
        temperature: 0.7,
        max_tokens: 4000
    });
    console.log("LLM RAW OUTPUT:", completion.choices[0].message.content);
}

test().catch(console.error);
