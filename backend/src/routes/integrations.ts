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
// @desc    Log a manually-entered workout as a "simulated" wearable sync.
//          There is no real OAuth connection to Strava/Apple Health/etc. yet -
//          this only records whatever distance/calories the client provides
//          (or a clearly-labeled placeholder if it provides none).
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

    // No real wearable OAuth is connected, so we only use numbers the client actually
    // provided. If it didn't provide any, we log a fixed placeholder rather than a
    // randomly-generated number that could look like a real reading.
    const isSimulated = distanceKm == null && calories == null;
    const syncedDistance = distanceKm ?? 5;
    const syncedCalories = calories ?? 400;

    todayLog.healthData = {
      steps: Math.floor(syncedDistance * 1320),
      distanceMeters: Math.floor(syncedDistance * 1000),
      activeCalories: syncedCalories
    };

    await todayLog.save();

    res.json({
      message: isSimulated
        ? `Logged a simulated workout entry (no ${provider || 'wearable'} account connected yet).`
        : `Logged ${syncedDistance} km workout from ${provider || 'Fitness App'}.`,
      log: todayLog,
      syncedTaskTitle: physicalTask ? physicalTask.title : 'Workout',
      simulated: isSimulated,
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
