const http = require('http');

async function runTests() {
  console.log("--- Starting Tests ---");

  // 1. Missing/invalid token
  console.log("\\nTest 1: Missing/invalid token");
  const res1 = await fetch('http://localhost:5000/api/profile/decision-dna');
  console.log("Status:", res1.status);
  console.log("Body:", await res1.json());

  // 2. Login as demo user
  console.log("\\nTest 2: Login as demo user (seeded in previous step)");
  const loginRes = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@executive.com', password: 'demo' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log("Login Status:", loginRes.status);
  console.log("Login Success:", loginData.success);

  if (!token) {
      console.error("Failed to get token, aborting subsequent tests.");
      return;
  }

  // 3. Authenticated demo user with no DecisionDNA -> user + decisionDNA: null
  console.log("\\nTest 3: Fetch profile with valid token (expecting null DNA)");
  const profileRes = await fetch('http://localhost:5000/api/profile/decision-dna', {
    headers: { 'X-Auth-Token': token }
  });
  console.log("Profile Status:", profileRes.status);
  console.log("Profile Body:", JSON.stringify(await profileRes.json(), null, 2));

  // 4. Test client-supplied userId is ignored
  console.log("\\nTest 4: Attempt to supply a fake userId in query parameter (should be ignored)");
  const fakeIdRes = await fetch('http://localhost:5000/api/profile/decision-dna?userId=123456789012345678901234', {
    headers: { 'X-Auth-Token': token }
  });
  console.log("Fake ID Status:", fakeIdRes.status);
  console.log("Fake ID Body (should match Test 3):", JSON.stringify(await fakeIdRes.json(), null, 2));

  // 5. Test with a seeded DecisionDNA record
  console.log("\\nTest 5: Authenticated user with DecisionDNA -> correct profile");
  
  // Seed a DecisionDNA record directly via MongoDB
  const mongoose = require('mongoose');
  const DecisionDNA = require('./models/DecisionDNA');
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority");
  
  const demoUserId = loginData.token ? require('./server').valid_tokens?.get(loginData.token) || loginData.token : null;
  // Actually, we can get the userId from the Test 3 response
  const profileJson = await (await fetch('http://localhost:5000/api/profile/decision-dna', { headers: { 'X-Auth-Token': token }})).json();
  const userId = profileJson.user._id;

  const newDna = new DecisionDNA({
      user: userId,
      decisionStyle: "Strategic Innovator",
      strategicThinking: 9,
      strengths: ["Visionary"]
  });
  await DecisionDNA.deleteMany({ user: userId });
  await newDna.save();

  const populatedProfileRes = await fetch('http://localhost:5000/api/profile/decision-dna', {
    headers: { 'X-Auth-Token': token }
  });
  const populatedProfileData = await populatedProfileRes.json();
  console.log("Populated Profile Status:", populatedProfileRes.status);
  console.log("Populated DNA Style:", populatedProfileData.decisionDNA.decisionStyle);
  console.log("Populated DNA Strengths:", populatedProfileData.decisionDNA.strengths);

  // Cleanup
  await DecisionDNA.deleteMany({ user: userId });
  await mongoose.disconnect();

  console.log("\\n--- Tests Complete ---");
}

require('dotenv').config();
runTests().catch(console.error);
