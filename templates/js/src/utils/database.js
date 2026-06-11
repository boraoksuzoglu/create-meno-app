import mongoose from 'mongoose';

/**
 * Singleton MongoDB connection manager
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    if (this.isConnected && this.connection) return this.connection;

    this.connection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 100,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    this.isConnected = true;
    console.log('[DB] Connected to MongoDB');

    this.connection.connection.on('disconnected', () => {
      this.isConnected = false;
      console.warn('[DB] Disconnected from MongoDB');
    });

    this.connection.connection.on('error', (err) => {
      console.error('[DB] Error:', err.message);
    });

    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.disconnect();
      this.isConnected = false;
      this.connection = null;
    }
  }

  isConnectedToDatabase() {
    return this.isConnected && this.connection?.connection?.readyState === 1;
  }
}

const databaseConnection = new DatabaseConnection();
export default databaseConnection;
