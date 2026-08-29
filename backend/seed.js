const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority";

const DEMO_USER = {
  name: "EV Demo Executive",
  designation: "Demo Executive",
  organisation: "Demo Organisation",
  industry: "Automotive",
  email: "demo@executive.com",
  batch: "DEMO",
  assessmentCompleted: false
};

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('Seeding demo user...');
    // Upsert guarantees idempotency: it will create if missing, or update if exists
    // based on the unique email address.
    const result = await User.findOneAndUpdate(
      { email: DEMO_USER.email },
      { $set: DEMO_USER },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`Demo user seeded successfully: ${result.name} (${result.email})`);
    
  } catch (error) {
    console.error('Error seeding demo user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

seed();
