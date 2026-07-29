import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import ChallengeTemplate from '../models/ChallengeTemplate';

import ActiveChallenge from '../models/ActiveChallenge';
import ChallengeGroup from '../models/ChallengeGroup';
import Notification from '../models/Notification';
import User from '../models/User';
import { cancelActiveChallenge } from '../utils/challengeHelpers';
import { getTodayStr } from '../utils/dateUtils';

const router = express.Router();

// @route   POST /api/challenges/start
// @desc    Start a new custom challenge
router.post('/start', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { durationDays, tasks, invitedFriendIds } = req.body;

  try {
    // Check if one already active
    const existing = await ActiveChallenge.findOne({ userId, status: 'active' });
    if (existing) {
      return res.status(400).json({ error: 'You already have an active challenge.' });
    }

    // Clear any existing DailyLog for today so new challenge starts at 0%
    const todayStr = getTodayStr();
    await DailyLog.findOneAndDelete({ userId, date: todayStr });

    const challenge = await ActiveChallenge.create({
      userId,
      durationDays: durationDays || 75,
      startDate: new Date(),
      tasks,
      status: 'active'
    });

    const user = await User.findById(userId);
    const groupName = `${user?.displayName || 'Athlete'}'s Challenge`;

    // ChallengeGroup is the single source of truth for crews. (A legacy `Group` model
    // also exists for an old, currently-unreachable join-by-code feature - it is
    // intentionally not created here anymore, since creating both produced two
    // separate crew entries for what is really one crew.)
    const challengeGroupCreated = await ChallengeGroup.create({
      name: groupName,
      creatorId: userId,
      members: [userId as any],
      durationDays: durationDays || 75,
      tasks,
      startDate: new Date(),
      isActive: true
    });

    // Send notifications (invites) to friends if provided
    if (invitedFriendIds && Array.isArray(invitedFriendIds)) {
      for (const friendId of invitedFriendIds) {
        await Notification.create({
          userId: friendId,
          type: 'group_invite',
          message: `${user?.displayName || 'A friend'} invited you to join a ${durationDays || 75}-day challenge!`,
          relatedData: {
            challengeGroupId: (challengeGroupCreated as any)._id,
            durationDays: durationDays || 75,
            tasks,
            inviterName: user?.displayName
          }
        });
      }
    }

    res.status(201).json({ challenge, group: challengeGroupCreated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error starting challenge' });
  }
});

// @route   GET /api/challenges/active
// @desc    Get the active custom challenge for the user
router.get('/active', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const challenge = await ActiveChallenge.findOne({ userId, status: 'active' }).sort({ startDate: -1 });
    res.json(challenge); // Will return null if none active, which is fine
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching challenge' });
  }
});

// @route   PUT /api/challenges/active/tasks
// @desc    Update the task list for the user's active challenge (Customize Tasks)
router.put('/active/tasks', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { tasks } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one task' });
  }
  for (const t of tasks) {
    if (!t || typeof t.id !== 'string' || typeof t.title !== 'string' || !t.title.trim()) {
      return res.status(400).json({ error: 'Each task needs an id and a non-empty title' });
    }
  }

  try {
    const challenge = await ActiveChallenge.findOneAndUpdate(
      { userId, status: 'active' },
      { tasks },
      { new: true }
    );
    if (!challenge) {
      return res.status(404).json({ error: 'No active challenge found' });
    }
    res.json(challenge);
  } catch (error) {
    console.error('Error updating tasks:', error);
    res.status(500).json({ error: 'Server error updating tasks' });
  }
});

// @route   POST /api/challenges/freeze-today
// @desc    Freeze today's challenge progress (Streak Freeze)
router.post('/freeze-today', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const todayStr = getTodayStr();

  try {
    const activeChallenge: any = await ActiveChallenge.findOne({ userId, status: 'active' });
    if (!activeChallenge) {
      return res.status(404).json({ error: 'No active challenge found' });
    }

    const freezeAllowed = activeChallenge.freezeDaysAllowed || 5;
    const freezeUsed = activeChallenge.freezeDaysUsed || 0;
    const frozenDates: string[] = activeChallenge.frozenDates || [];

    if (frozenDates.includes(todayStr)) {
      return res.status(400).json({ error: 'Today is already frozen!' });
    }

    if (freezeUsed >= freezeAllowed) {
      return res.status(400).json({ error: `You have used all ${freezeAllowed} freeze days for this challenge.` });
    }

    activeChallenge.freezeDaysUsed = freezeUsed + 1;
    activeChallenge.frozenDates.push(todayStr);
    await activeChallenge.save();

    res.json({
      message: 'Today has been successfully frozen! ❄️ Your streak is protected.',
      challenge: activeChallenge
    });
  } catch (error) {
    console.error('Error freezing today:', error);
    res.status(500).json({ error: 'Server error applying streak freeze' });
  }
});

import DailyLog from '../models/DailyLog';

// @route   POST /api/challenges/cancel
// @desc    Cancel current active challenge
router.post('/cancel', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const challenge = await cancelActiveChallenge(userId as string);
    res.json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error cancelling challenge' });
  }
});

// @route   GET /api/challenges/all
// @desc    Get all challenges for a user (history)
router.get('/all', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const challenges = await ActiveChallenge.find({ userId }).sort({ startDate: -1 });
    res.json(challenges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching all challenges' });
  }
});

export default router;
