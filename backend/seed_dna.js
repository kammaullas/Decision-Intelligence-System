require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DecisionDNA = require('./models/DecisionDNA');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(MONGODB_URI);
    
    const user = await User.findOne({ email: "demo@executive.com" });
    if (!user) {
        console.log("User not found");
        process.exit(1);
    }

    let dna = await DecisionDNA.findOne({ user: user._id });
    if (!dna) {
        console.log("Creating default Decision DNA for demo user...");
        dna = new DecisionDNA({
            user: user._id,
            decisionStyle: "Analytical & Structured",
            traits: {
                riskTolerance: 8,
                strategicHorizon: 9,
                dataReliance: 7,
                stakeholderOrientation: 6,
                speedVsAccuracy: 5
            },
            strengths: ["Long-term strategic alignment", "Data-driven logic", "High comfort with calculated risk"],
            blindSpots: ["May over-analyze when data is sparse", "Can sometimes prioritize numbers over cultural impact"],
            cognitiveBiases: ["Anchoring bias potential", "Confirmation bias towards optimistic projections"],
            recommendedCoaching: [
                "Balance analytical rigor with rapid execution in high-ambiguity environments.",
                "Ensure key stakeholders are brought along early in the decision journey."
            ]
        });
        await dna.save();
        
        user.decisionDNAID = dna._id;
        await user.save();
        console.log("Decision DNA created successfully.");
    } else {
        console.log("DNA already exists for this user.");
    }
    
    mongoose.connection.close();
}

run();
