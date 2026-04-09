const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, mem: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/interview-sharing-platform';

    const opts = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected Successfully');
      return mongoose;
    }).catch(async (error) => {
      console.error('❌ MongoDB Connection Error:', error.message);

      const allowInMemory =
        process.env.USE_IN_MEMORY_DB !== 'false' &&
        process.env.NODE_ENV !== 'production';

      if (!allowInMemory) {
        cached.promise = null; // Reset on error
        throw error;
      }

      // Fallback: in-memory MongoDB for local dev (no Atlas/Docker needed)
      console.warn('⚠️ Falling back to in-memory MongoDB (dev only).');
      if (!cached.mem) {
        cached.mem = await MongoMemoryServer.create();
      }
      const memUri = cached.mem.getUri();
      return mongoose.connect(memUri, opts).then((m) => {
        console.log('✅ In-memory MongoDB started');
        return m;
      });
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = { connectDB, getLastError: () => mongoose.connection.readyState !== 1 ? 'Not connected' : null };