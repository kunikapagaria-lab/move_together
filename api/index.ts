import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from '../backend/src/routes/auth';
import challengeRoutes from '../backend/src/routes/challenges';
import logRoutes from '../backend/src/routes/logs';
import groupRoutes from '../backend/src/routes/groups';
import friendRoutes from '../backend/src/routes/friends';
import notificationRoutes from '../backend/src/routes/notifications';
import integrationRoutes from '../backend/src/routes/integrations';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://kunikapagaria_db_user:Bhumika3012@ac-g7rdk1v-shard-00-00.ljvofrs.mongodb.net:27017,ac-g7rdk1v-shard-00-01.ljvofrs.mongodb.net:27017,ac-g7rdk1v-shard-00-02.ljvofrs.mongodb.net:27017/75hard?ssl=true&replicaSet=atlas-141g66-shard-0&authSource=admin&appName=Cluster0";

// Serverless DB Connection Caching
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = !!db.connections[0].readyState;
  } catch (err) {
    console.error('MongoDB serverless connection error:', err);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Mount Backend API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vercel Serverless Backend Connected to MongoDB Atlas' });
});

export default app;
