import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import DailyLog from '../models/DailyLog';

const router = express.Router();

// Helper to format Date to YYYY-MM-DD in local time
const getTodayStr = () => {
  const today = new Date();
  return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
};

// @route   GET /api/logs/today
// @desc    Get or create today's log for the given challenge
router.get('/today/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId } = req.params;
  const todayStr = getTodayStr();

  try {
    let log = await DailyLog.findOne({
      userId,
      activeChallengeId: challengeId,
      date: todayStr
    });

    if (!log) {
      log = await DailyLog.create({
        userId,
        activeChallengeId: challengeId as any,
        date: todayStr,
        completedTaskIds: [],
        journalEntry: ''
      });
    }

    res.json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching daily log' });
  }
});

// @route   PUT /api/logs/toggle-task
// @desc    Toggle a task status
router.put('/toggle-task', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId, taskId, isCompleted } = req.body;
  const todayStr = getTodayStr();

  try {
    let log = await DailyLog.findOne({
      userId,
      activeChallengeId: challengeId,
      date: todayStr
    });

    if (!log) {
      log = await DailyLog.create({
        userId,
        activeChallengeId: challengeId as any,
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
    console.error(error);
    res.status(500).json({ error: 'Server error toggling task' });
  }
});

// @route   PUT /api/logs/journal
// @desc    Update journal entry for today
router.put('/journal', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId, journalEntry } = req.body;
  const todayStr = getTodayStr();

  try {
    const log = await DailyLog.findOne({
      userId,
      activeChallengeId: challengeId,
      date: todayStr
    });

    if (!log) {
      return res.status(404).json({ error: 'Daily log not found for today' });
    }

    log.journalEntry = journalEntry;
    await log.save();
    res.json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error saving journal' });
  }
});

// @route   GET /api/logs/streak/:challengeId
// @desc    Calculate current streak
router.get('/streak/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId } = req.params;

  try {
    const logs = await DailyLog.find({ userId, activeChallengeId: challengeId }).sort({ date: -1 });
    
    // We need the challenge to know how many tasks are required
    const ActiveChallenge = require('../models/ActiveChallenge').default;
    const challenge = await ActiveChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    const requiredTasks = challenge.tasks.length;

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
    console.error(error);
    res.status(500).json({ error: 'Server error calculating streak' });
  }
});

// @route   GET /api/logs/history/:challengeId
// @desc    Get the last 7 days of logs for charts/progress
router.get('/history/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId } = req.params;

  try {
    const logs = await DailyLog.find({ userId, activeChallengeId: challengeId })
      .sort({ date: -1 })
      .limit(7);
    
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

// @route   GET /api/logs/challenge/:challengeId/all
// @desc    Get all logs for a specific challenge (for Journey Calendar)
router.get('/challenge/:challengeId/all', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId } = req.params;

  try {
    const logs = await DailyLog.find({ userId, activeChallengeId: challengeId }).sort({ date: 1 }); // Sort chronologically
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching challenge logs' });
  }
});

export default router;
