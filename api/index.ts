import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from '../backend/src/routes/auth';
import challengeRoutes from '../backend/src/routes/challenges';
import logRoutes from '../backend/src/routes/logs';
import groupRoutes from '../backend/src/routes/groups';
import friendRoutes from '../backend/src/routes/friends';
import notificationRoutes from '../backend/src/routes/notifications';
import integrationRoutes from '../backend/src/routes/integrations';
import routineRoutes from '../backend/src/routes/routine';
import { corsOptions } from '../backend/src/config/cors';
import { authLimiter } from '../backend/src/middleware/rateLimiter';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start with an insecure default.');
}

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;

// Serverless DB Connection Caching
let isConnected = false;
const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Database not connected.');
    return;
  }
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
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/routine', routineRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vercel Serverless Backend Connected to MongoDB Atlas' });
});

export default app;
