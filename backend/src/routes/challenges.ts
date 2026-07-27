import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import ChallengeTemplate from '../models/ChallengeTemplate';

import ActiveChallenge from '../models/ActiveChallenge';
import ChallengeGroup from '../models/ChallengeGroup';
import Group from '../models/Group';
import Notification from '../models/Notification';
import User from '../models/User';

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

    const groupCreated = await Group.create({
      name: groupName,
      challengeTemplateId: challenge._id as any,
      startDate: new Date(),
      members: [userId as any],
      wagerPot: 0
    });

    await ChallengeGroup.create({
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
            groupId: (groupCreated as any)._id,
            durationDays: durationDays || 75,
            tasks,
            inviterName: user?.displayName
          }
        });
      }
    }

    res.status(201).json({ challenge, group: groupCreated });
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

// @route   POST /api/challenges/freeze-today
// @desc    Freeze today's challenge progress (Streak Freeze)
router.post('/freeze-today', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

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

const getTodayStr = () => {
  const today = new Date();
  return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
};

// @route   POST /api/challenges/cancel
// @desc    Cancel current active challenge
router.post('/cancel', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const todayStr = getTodayStr();

  try {
    const challenge = await ActiveChallenge.findOneAndUpdate(
      { userId, status: 'active' },
      { status: 'cancelled' },
      { new: true }
    );

    // Deactivate associated groups so old crews aren't reused
    await Group.updateMany({ members: userId }, { isActive: false });
    await ChallengeGroup.updateMany({ $or: [{ members: userId }, { creatorId: userId }] }, { isActive: false });

    // Clear today's log so completed tasks from cancelled challenge don't bleed into next challenge
    await DailyLog.findOneAndDelete({ userId, date: todayStr });

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

// @route   GET /api/challenges/groups
// @desc    Get all active challenge groups the user is part of
router.get('/groups', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const groups = await ChallengeGroup.find({ members: userId, isActive: true })
      .populate('members', 'displayName email')
      .exec();

    // Attach current streak/todayCompleted for each member
    // Since ActiveChallenge calculates streak, we fetch active challenges for these members
    const enrichedGroups = await Promise.all(groups.map(async (group) => {
      const enrichedMembers = await Promise.all(group.members.map(async (member: any) => {
        const activeChallenge = await ActiveChallenge.findOne({ userId: member._id, status: 'active' });
        
        let streak = 0;
        let todayCompleted = 0;

        if (activeChallenge) {
          // Calculate streak (simplified based on log dates)
          const logs = await import('../models/DailyLog').then(m => m.default.find({ userId: member._id, activeChallengeId: activeChallenge._id }).sort({ date: -1 }));
          
          const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
          
          let currentStreak = 0;
          for (let i = 0; i < logs.length; i++) {
             if (logs[i].completedTaskIds.length === (activeChallenge.tasks as any).length) {
                currentStreak++;
             } else {
                if (logs[i].date === todayStr) continue;
                break;
             }
          }
          streak = currentStreak;
          
          const todayLog = logs.find(l => l.date === todayStr);
          todayCompleted = todayLog ? todayLog.completedTaskIds.length : 0;
        }

        return {
          userId: member,
          streak,
          todayCompleted
        };
      }));

      return {
        _id: group._id,
        name: group.name,
        durationDays: group.durationDays,
        members: enrichedMembers
      };
    }));

    res.json(enrichedGroups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching groups' });
  }
});

export default router;
