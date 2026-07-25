import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import ChallengeTemplate from '../models/ChallengeTemplate';

import ActiveChallenge from '../models/ActiveChallenge';
import ChallengeGroup from '../models/ChallengeGroup';
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

    const challenge = await ActiveChallenge.create({
      userId,
      durationDays: durationDays || 75,
      startDate: new Date(),
      tasks,
      status: 'active'
    });

    let groupCreated = null;

    // Handle Group creation if invited friends exist
    if (invitedFriendIds && invitedFriendIds.length > 0) {
      const user = await User.findById(userId);
      const groupName = `${user?.displayName || 'User'}'s Challenge`;

      groupCreated = await ChallengeGroup.create({
        name: groupName,
        creatorId: userId,
        members: [userId as any],
        durationDays: durationDays || 75,
        tasks,
        startDate: new Date(),
        isActive: true
      });

      // Send notifications (invites) to friends
      for (const friendId of invitedFriendIds) {
        await Notification.create({
          userId: friendId,
          type: 'group_invite',
          message: `${user?.displayName} invited you to join a ${durationDays || 75}-day challenge!`,
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

// @route   POST /api/challenges/cancel
// @desc    Cancel current active challenge
router.post('/cancel', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const challenge = await ActiveChallenge.findOneAndUpdate(
      { userId, status: 'active' },
      { status: 'cancelled' },
      { new: true }
    );
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
             if (logs[i].completedTaskIds.length === activeChallenge.tasks.length) {
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
