require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../backend/models/User');

async function run() {
  const argv = process.argv.slice(2);
  const emailArg = argv.find(a => a.startsWith('--email='));
  const passArg = argv.find(a => a.startsWith('--password='));
  if (!emailArg || !passArg) {
    console.error('Usage: node scripts/reset_password.js --email=<email> --password=<newPassword>');
    process.exit(1);
  }
  const email = emailArg.split('=')[1];
  const plain = passArg.split('=')[1];
  if (!email || !plain) {
    console.error('Email or password empty');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found for email:', email);
      process.exit(1);
    }
    // Assign plain password; model hook will hash exactly once
    user.password = plain;
    await user.save();
    console.log('Password updated for', email);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
