import express, { Response } from 'express';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middleware/auth';
import DailyLog from '../models/DailyLog';
import ActiveChallenge from '../models/ActiveChallenge';
import { getTodayStr } from '../utils/dateUtils';

const router = express.Router();

const safeQuery = (userId: any, rawId: string | string[], extra: any = {}) => {
  const challengeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const query: any = { userId, ...extra };
  if (challengeId && mongoose.Types.ObjectId.isValid(challengeId)) {
    query.activeChallengeId = new mongoose.Types.ObjectId(challengeId);
  }
  return query;
};

// Finds today's log for a user, creating one if it doesn't exist yet.
// Tolerates a duplicate-key race (two concurrent requests both trying to create
// the first log of the day) by re-fetching instead of failing.
const findOrCreateTodayLog = async (userId: any, challengeId: string, todayStr: string, defaults: any = {}) => {
  const query = safeQuery(userId, challengeId, { date: todayStr });
  let log = await DailyLog.findOne(query);
  if (!log) {
    log = await DailyLog.findOne({ userId, date: todayStr });
  }
  if (log) return log;

  try {
    return await DailyLog.create({
      userId,
      activeChallengeId: mongoose.Types.ObjectId.isValid(challengeId) ? challengeId as any : new mongoose.Types.ObjectId(),
      date: todayStr,
      completedTaskIds: [],
      journalEntry: '',
      ...defaults,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const existing = await DailyLog.findOne({ userId, date: todayStr });
      if (existing) return existing;
    }
    throw error;
  }
};

// @route   GET /api/logs/today/:challengeId
router.get('/today/:challengeId', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const challengeId = Array.isArray(req.params.challengeId) ? req.params.challengeId[0] : req.params.challengeId;
  const todayStr = getTodayStr();

  try {
    const log = await findOrCreateTodayLog(userId, challengeId, todayStr);
    res.json(log);
  } catch (error) {
    console.error('Error fetching today log:', error);
    res.status(500).json({ error: 'Server error fetching today\'s log' });
  }
});

// @route   PUT /api/logs/toggle-task
router.put('/toggle-task', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId, taskId, isCompleted } = req.body;
  const todayStr = getTodayStr();

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  try {
    const log = await findOrCreateTodayLog(userId, challengeId, todayStr);

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
    res.status(500).json({ error: 'Server error toggling task' });
  }
});

// @route   PUT /api/logs/journal
router.put('/journal', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { challengeId, journalEntry } = req.body;
  const todayStr = getTodayStr();

  try {
    const log = await findOrCreateTodayLog(userId, challengeId, todayStr, { journalEntry: journalEntry || '' });
    log.journalEntry = journalEntry || '';
    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Error saving journal:', error);
    res.status(500).json({ error: 'Server error saving journal' });
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
    let taskIds: string[] | null = null;
    let frozenDates: string[] = [];
    if (mongoose.Types.ObjectId.isValid(challengeId)) {
      const challenge = await ActiveChallenge.findById(challengeId);
      if (challenge && challenge.tasks) {
        requiredTasks = (challenge.tasks as any).length;
        taskIds = (challenge.tasks as any[]).map(t => t.id);
      }
      if (challenge) {
        frozenDates = (challenge as any).frozenDates || [];
      }
    }

    let streak = 0;
    const todayStr = getTodayStr();

    for (let i = 0; i < logs.length; i++) {
      const rawCompleted = logs[i]?.completedTaskIds || [];
      // Only count completions matching a task currently on the challenge - a log
      // can carry stale ids from before tasks were customized down, which
      // previously inflated the count past the current required total.
      const completedCount = taskIds ? rawCompleted.filter(id => taskIds!.includes(id)).length : rawCompleted.length;
      if (completedCount >= requiredTasks) {
        streak++;
      } else if (logs[i]?.date === todayStr || frozenDates.includes(logs[i]?.date)) {
        // Today (not over yet) or a Streak-Freeze-protected day - don't break
        // the streak over it, but don't count it as a completed day either.
        continue;
      } else {
        break;
      }
    }

    res.json({ streak, totalDaysLogged: logs.length });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.status(500).json({ error: 'Server error calculating streak' });
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
    res.status(500).json({ error: 'Server error fetching history' });
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
    res.status(500).json({ error: 'Server error fetching challenge logs' });
  }
});

export default router;
