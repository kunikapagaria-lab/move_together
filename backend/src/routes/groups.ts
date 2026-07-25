import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Group from '../models/Group';
import User from '../models/User';

const router = express.Router();

// Generate a random 6-character code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// @route   POST /api/groups/create
// @desc    Create a new group
router.post('/create', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, challengeTemplateId } = req.body;

  try {
    const group = await Group.create({
      name,
      challengeTemplateId: challengeTemplateId as any,
      startDate: new Date(),
      members: [userId as any],
      wagerPot: 0
    });

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating group' });
  }
});

// @route   POST /api/groups/join
// @desc    Join a group via code
router.post('/join', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { joinCode } = req.body;

  try {
    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    if (group.members.some((m: any) => m.userId?.toString() === userId)) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    group.members.push({ userId, joinedAt: new Date() } as any);
    await group.save();

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error joining group' });
  }
});

import DailyLog from '../models/DailyLog';

// Helper to format Date to YYYY-MM-DD in local time
const getTodayStr = () => {
  const today = new Date();
  return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
};

// @route   GET /api/groups/my-groups
// @desc    Get all groups the user is part of, including member details
router.get('/my-groups', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const todayStr = getTodayStr();

  try {
    const groups = await Group.find({ 'members.userId': userId })
      .populate('members.userId', 'displayName email')
      .exec();

    // Now, let's fetch streak and todayCompleted for each member
    const enrichedGroups = await Promise.all(groups.map(async (group) => {
      const enrichedMembers = await Promise.all(group.members.map(async (member: any) => {
        // Fetch all logs to calculate streak (simplified)
        const logs = await DailyLog.find({ userId: member.userId._id, challengeTemplateId: group.challengeTemplateId }).sort({ date: -1 });
        let streak = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (let i = 0; i < logs.length; i++) {
          if (logs[i].completedTaskIds.length === 5) { // Assuming 5 tasks is complete for now
            streak++;
          } else {
            const logDate = new Date(logs[i].date);
            logDate.setHours(0,0,0,0);
            if (logDate.getTime() === today.getTime()) {
               continue;
            } else {
               break;
            }
          }
        }

        // Fetch today's log
        const todayLog = logs.find(l => l.date === todayStr);
        const todayCompleted = todayLog ? todayLog.completedTaskIds.length : 0;

        return {
          userId: member.userId,
          joinedAt: member.joinedAt,
          streak,
          todayCompleted
        };
      }));

      return {
        _id: group._id,
        name: group.name,
        joinCode: (group as any).joinCode,
        challengeTemplateId: group.challengeTemplateId,
        wagerAmount: (group as any).wagerAmount,
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
