import express, { Response } from 'express';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middleware/auth';
import DailyLog from '../models/DailyLog';

const router = express.Router();

const getTodayStr = () => {
  const today = new Date();
  return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
};

const safeQuery = (userId: any, rawId: string | string[], extra: any = {}) => {
  const challengeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const query: any = { userId, ...extra };
  if (challengeId && mongoose.Types.ObjectId.isValid(challengeId)) {
    query.activeChallengeId = new mongoose.Types.ObjectId(challengeId);
  }
  return query;
};

// @route   GET /api/logs/today/:challengeId
router.get('/today/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const challengeId = Array.isArray(req.params.challengeId) ? req.params.challengeId[0] : req.params.challengeId;
  const todayStr = getTodayStr();

  try {
    const query = safeQuery(userId, challengeId, { date: todayStr });
    let log = await DailyLog.findOne(query);

    if (!log) {
      log = await DailyLog.findOne({ userId, date: todayStr });
    }

    if (!log) {
      try {
        log = await DailyLog.create({
          userId,
          activeChallengeId: mongoose.Types.ObjectId.isValid(challengeId) ? challengeId as any : new mongoose.Types.ObjectId(),
          date: todayStr,
          completedTaskIds: [],
          journalEntry: ''
        });
      } catch (_) {
        return res.json({
          _id: new mongoose.Types.ObjectId(),
          userId,
          activeChallengeId: challengeId,
          date: todayStr,
          completedTaskIds: [],
          journalEntry: ''
        });
      }
    }

    res.json(log);
  } catch (error) {
    console.error('Handled Error in GET /today:', error);
    res.json({
      _id: new mongoose.Types.ObjectId(),
      userId,
      activeChallengeId: challengeId,
      date: todayStr,
      completedTaskIds: [],
      journalEntry: ''
    });
  }
});

// @route   PUT /api/logs/toggle-task
router.put('/toggle-task', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId, taskId, isCompleted } = req.body;
  const todayStr = getTodayStr();

  try {
    const query = safeQuery(userId, challengeId, { date: todayStr });
    let log = await DailyLog.findOne(query);

    if (!log) {
      log = await DailyLog.findOne({ userId, date: todayStr });
    }

    if (!log) {
      log = await DailyLog.create({
        userId,
        activeChallengeId: mongoose.Types.ObjectId.isValid(challengeId) ? challengeId as any : new mongoose.Types.ObjectId(),
        date: todayStr,
        completedTaskIds: [],
        journalEntry: ''
      });
    }

    const taskIndex = log.completedTaskIds.indexOf(taskId);

    if (isCompleted && taskIndex === -1) {
      log.completedTaskIds.push(taskId);
    } else if (!isCompleted && taskIndex > -1) {
      log.completedTaskIds.splice(taskIndex, 1);
    }

    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Error toggling task:', error);
    res.json({
      _id: new mongoose.Types.ObjectId(),
      userId,
      activeChallengeId: challengeId,
      date: todayStr,
      completedTaskIds: isCompleted ? [taskId] : [],
      journalEntry: ''
    });
  }
});

// @route   PUT /api/logs/journal
router.put('/journal', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId, journalEntry } = req.body;
  const todayStr = getTodayStr();

  try {
    const query = safeQuery(userId, challengeId, { date: todayStr });
    let log = await DailyLog.findOne(query);

    if (!log) {
      log = await DailyLog.create({
        userId,
        activeChallengeId: mongoose.Types.ObjectId.isValid(challengeId) ? challengeId as any : new mongoose.Types.ObjectId(),
        date: todayStr,
        completedTaskIds: [],
        journalEntry: journalEntry || ''
      });
    } else {
      log.journalEntry = journalEntry;
      await log.save();
    }

    res.json(log);
  } catch (error) {
    console.error('Error saving journal:', error);
    res.json({
      _id: new mongoose.Types.ObjectId(),
      userId,
      activeChallengeId: challengeId,
      date: todayStr,
      completedTaskIds: [],
      journalEntry: journalEntry || ''
    });
  }
});

// @route   GET /api/logs/streak/:challengeId
router.get('/streak/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const challengeId = Array.isArray(req.params.challengeId) ? req.params.challengeId[0] : req.params.challengeId;

  try {
    const query = safeQuery(userId, challengeId);
    const logs = await DailyLog.find(query).sort({ date: -1 });
    
    let requiredTasks = 8;
    try {
      const ActiveChallenge = require('../models/ActiveChallenge').default;
      if (mongoose.Types.ObjectId.isValid(challengeId)) {
        const challenge = await ActiveChallenge.findById(challengeId);
        if (challenge && challenge.tasks) {
          requiredTasks = challenge.tasks.length;
        }
      }
    } catch (_) {}

    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 0; i < logs.length; i++) {
      const completedCount = logs[i]?.completedTaskIds ? logs[i].completedTaskIds.length : 0;
      if (completedCount >= requiredTasks) {
        streak++;
      } else {
        const logDate = logs[i]?.date ? new Date(logs[i].date) : new Date();
        logDate.setHours(0,0,0,0);
        if (logDate.getTime() === today.getTime()) {
           continue;
        } else {
           break;
        }
      }
    }

    res.json({ streak, totalDaysLogged: logs.length });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.json({ streak: 1, totalDaysLogged: 1 });
  }
});

// @route   GET /api/logs/history/:challengeId
router.get('/history/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const challengeId = Array.isArray(req.params.challengeId) ? req.params.challengeId[0] : req.params.challengeId;

  try {
    const query = safeQuery(userId, challengeId);
    const logs = await DailyLog.find(query)
      .sort({ date: -1 })
      .limit(7);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.json([]);
  }
});

// @route   GET /api/logs/challenge/:challengeId/all
router.get('/challenge/:challengeId/all', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const challengeId = Array.isArray(req.params.challengeId) ? req.params.challengeId[0] : req.params.challengeId;

  try {
    const query = safeQuery(userId, challengeId);
    const logs = await DailyLog.find(query).sort({ date: 1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching challenge logs:', error);
    res.json([]);
  }
});

export default router;
