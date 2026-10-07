require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas first
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 HRMS & Attendance Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`===============================================`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error('💥 Unhandled Rejection:', err);
      // Keep running in dev, or close gracefully
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
