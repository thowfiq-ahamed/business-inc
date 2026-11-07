const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'test') {
        console.warn('Test environment: MONGODB_URI not configured, skipping initial DB connection.');
        return null;
      }
      throw new Error('MONGODB_URI is required. Copy server/.env.example and set a database URL.');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'test') {
      console.warn('Continuing tests in isolated mode...');
      return null;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
