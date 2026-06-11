import mongoose from 'mongoose';

/**
 * Singleton MongoDB connection manager
 */
class DatabaseConnection {
  private isConnected = false;
  private connection: typeof mongoose | null = null;

  async connect(): Promise<typeof mongoose> {
    if (this.isConnected && this.connection) return this.connection;

    this.connection = await mongoose.connect(process.env.MONGODB_URI as string, {
      maxPoolSize: 100,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    this.isConnected = true;
    console.log('[DB] Connected to MongoDB');

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.warn('[DB] Disconnected from MongoDB');
    });

    return this.connection;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connection = null;
    }
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

const databaseConnection = new DatabaseConnection();
export default databaseConnection;
