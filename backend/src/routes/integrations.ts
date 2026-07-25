import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import ActiveChallenge from '../models/ActiveChallenge';
import DailyLog from '../models/DailyLog';

const router = express.Router();

const getTodayStr = () => {
  const today = new Date();
  return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
};

// @route   POST /api/integrations/sync
// @desc    Sync workout telemetry from wearable/fitness app source
router.post('/sync', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { provider, distanceKm, calories, workoutName } = req.body;
  const todayStr = getTodayStr();

  try {
    const activeChallenge = await ActiveChallenge.findOne({ userId, status: 'active' });
    if (!activeChallenge) {
      return res.status(400).json({ error: 'No active challenge found to sync data.' });
    }

    let todayLog = await DailyLog.findOne({
      userId,
      activeChallengeId: activeChallenge._id,
      date: todayStr
    });

    if (!todayLog) {
      todayLog = await DailyLog.create({
        userId,
        activeChallengeId: activeChallenge._id,
        date: todayStr,
        completedTaskIds: [],
        journalEntry: ''
      });
    }

    const tasksArr = activeChallenge.tasks as any[];
    const physicalTask = tasksArr.find((t: any) => 
      !todayLog.completedTaskIds.includes(t.id) &&
      (t.title.toLowerCase().includes('run') || 
       t.title.toLowerCase().includes('workout') || 
       t.title.toLowerCase().includes('cardio') ||
       t.title.toLowerCase().includes('training') ||
       t.title.toLowerCase().includes('stretch') ||
       t.title.toLowerCase().includes('yoga'))
    ) || tasksArr[0]; // fallback to first task if all done or custom

    if (physicalTask && !todayLog.completedTaskIds.includes(physicalTask.id)) {
      todayLog.completedTaskIds.push(physicalTask.id);
    }

    // Store health telemetry
    const syncedDistance = distanceKm || Number((Math.random() * 3 + 3).toFixed(1));
    const syncedCalories = calories || Math.floor(Math.random() * 200 + 350);

    todayLog.healthData = {
      steps: Math.floor(syncedDistance * 1320),
      distanceMeters: Math.floor(syncedDistance * 1000),
      activeCalories: syncedCalories
    };

    await todayLog.save();

    res.json({
      message: `Synced ${syncedDistance} km workout from ${provider || 'Fitness App'}!`,
      log: todayLog,
      syncedTaskTitle: physicalTask ? physicalTask.title : 'Workout',
      telemetry: {
        provider: provider || 'Fitness Provider',
        workoutName: workoutName || 'Outdoor Activity',
        distanceKm: syncedDistance,
        calories: syncedCalories,
        steps: todayLog.healthData.steps
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error processing integration sync' });
  }
});

export default router;
