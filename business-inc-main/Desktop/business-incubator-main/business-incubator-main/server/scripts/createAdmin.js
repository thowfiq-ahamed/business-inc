require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'password123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    existingAdmin.name = existingAdmin.name || name;
    existingAdmin.role = 'admin';
    existingAdmin.verified = true;
    await existingAdmin.save();
    console.log(`Admin account updated: ${email}`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'admin',
      verified: true,
      bio: 'Platform administrator.',
    });
    console.log(`Admin account created: ${email}`);
  }

  await mongoose.connection.close();
}

createAdmin().catch(async error => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
