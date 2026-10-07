require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

async function testConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    const conn = await connectDB();
    const admin = conn.connection.db.admin();
    const pingResult = await admin.ping();
    console.log(' Ping result:', pingResult);
    console.log(' Collections in database:', (await conn.connection.db.listCollections().toArray()).map(c => c.name));
    console.log(' MongoDB Atlas verification successful!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(' Verification failed:', err);
    process.exit(1);
  }
}

testConnection();
