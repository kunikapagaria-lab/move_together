import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas!');
    
    const users = await User.find({}, 'displayName email createdAt');
    console.log(`\n📊 Registered Users in Database (${users.length}):`);
    console.table(users.map(u => ({
      ID: u._id.toString(),
      Name: u.displayName,
      Email: u.email,
      Joined: u.createdAt
    })));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
};

inspect();
