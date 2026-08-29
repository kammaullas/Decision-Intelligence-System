require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://test:test@cluster0.mongodb.net/dia-decisions?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({}, 'email name');
    console.log("Valid Users in DB:", users);
    mongoose.connection.close();
}
run();
