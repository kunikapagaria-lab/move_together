import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clearDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    console.log('Clearing all collections...');
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      await collections[key].deleteMany({});
      console.log(`Cleared collection: ${key}`);
    }

    console.log('Database cleared 100% clean!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDB();
