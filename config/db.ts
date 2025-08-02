import mongoose from 'mongoose';
import logger from '../utils/logger/logger';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env['MONGO_URI'] || '');
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    logger.error('MongoDB connection failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
};

export default connectDB; 