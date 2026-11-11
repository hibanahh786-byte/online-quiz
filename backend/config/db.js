const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongodInstance = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_quiz_db';
  
  try {
    // Attempt standard connection with 2-second timeout
    console.log(`Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✔ MongoDB Connected Successfully to: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`! Standard MongoDB connection at ${uri} not active (${err.message}).`);
    console.log(' Starting Embedded MongoDB Server with persistent storage...');

    try {
      const dataDir = path.join(__dirname, '../../.mongodb_data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'online_quiz_db',
          dbPath: dataDir,
          storageEngine: 'wiredTiger'
        },
        spawn: {
          startupTimeout: 60000
        }
      });
      const memoryUri = mongodInstance.getUri();
      console.log(`✔ Embedded MongoDB instance online at: ${memoryUri}`);

      await mongoose.connect(memoryUri);
      console.log(`✔ MongoDB Connected via Embedded Instance.`);
    } catch (fallbackErr) {
      console.error(`✖ Failed to connect to any MongoDB instance:`, fallbackErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
