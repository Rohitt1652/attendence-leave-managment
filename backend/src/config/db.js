const mongoose = require('mongoose');
const dns = require('dns');

// On Windows/certain local networks, default DNS servers fail on SRV queries for Atlas.
// Setting public reliable DNS ensures Atlas SRV resolution works reliably.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom dns servers cannot be set
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is missing in backend/.env');
    }

    console.log('Connecting to MongoDB Atlas (database: hrms_attendance)...');
    
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'hrms_attendance',
      autoIndex: true, // Build indexes in development
    });

    console.log(` MongoDB Atlas Connected successfully: ${conn.connection.host}`);
    console.log(` Active Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(' MongoDB Atlas Connection Error:');
    console.error(error.message);
    // Explicitly do NOT silently continue and do NOT fall back to local MongoDB
    process.exit(1);
  }
};

module.exports = connectDB;
