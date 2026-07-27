import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is missing');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log(`Connected to DB: ${mongoose.connection.name}`);

    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log('Collections in database:');
    
    if (collections) {
      for (const col of collections) {
        const count = await mongoose.connection.db?.collection(col.name).countDocuments();
        console.log(`- ${col.name}: ${count} documents`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkDB();
