import express, { Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import DailyLog from './models/DailyLog';
import User from './models/User';

import authRoutes from './routes/auth';
import { protect, AuthRequest } from './middleware/auth';
import challengeRoutes from './routes/challenges';
import logRoutes from './routes/logs';
import groupRoutes from './routes/groups';
import friendRoutes from './routes/friends';
import notificationRoutes from './routes/notifications';
import integrationRoutes from './routes/integrations';
import { startCronJobs } from './cron/midnightReset';

dotenv.config();

// Start cron jobs
startCronJobs();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.warn("MONGODB_URI is not set in .env file. Database not connected.");
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/integrations', integrationRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// AI Tough Love Coach Route (Protected)
app.post('/api/coach/insight', protect, async (req: AuthRequest, res: Response) => {
  // Use the ID from the verified JWT token
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    // 1. Fetch user to get their preferred coach style
    const user = await User.findById(userId);
    const style = user?.preferences?.coachStyle || 'tough-love';

    // 2. Fetch last 3 days of logs to pass to the AI
    const recentLogs = await DailyLog.find({ userId })
      .sort({ date: -1 })
      .limit(3);

    // 3. (MOCK) Send data to OpenAI/Gemini here.
    // For now, we return a mock response based on the style.
    
    let message = "";
    if (style === 'tough-love') {
      message = "You missed your workout yesterday. Excuses don't build discipline. Get after it today or don't bother showing up.";
    } else {
      message = "Every day is a new beginning. Let's focus on consistency today. You've got this.";
    }

    res.json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating AI insight' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
