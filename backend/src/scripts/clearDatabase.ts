import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const forceClearDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is missing');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection failed');
      process.exit(1);
    }

    console.log(`Connected to Database: ${mongoose.connection.name}`);
    const collections = await db.listCollections().toArray();

    for (const col of collections) {
      console.log(`Wiping collection: ${col.name}...`);
      await db.collection(col.name).deleteMany({});
      console.log(`✓ Cleared collection: ${col.name}`);
    }

    console.log('\n🎉 ALL MONGODB ATLAS COLLECTIONS ARE NOW 100% CLEARED AND EMPTY!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

forceClearDB();
