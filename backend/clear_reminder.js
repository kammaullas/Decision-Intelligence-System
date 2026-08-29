require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(MONGODB_URI);
    
    const user = await User.findOne({ email: "demo@executive.com" });
    if (!user) {
        console.log("User not found");
        process.exit(1);
    }

    user.dailyReminder = undefined;
    await user.save();
    console.log("Cleared daily reminder cache!");
    
    mongoose.connection.close();
}

run();
