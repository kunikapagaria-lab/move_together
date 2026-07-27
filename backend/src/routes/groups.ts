import express, { Response } from 'express';
import mongoose from 'mongoose';
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

import ActiveChallenge from '../models/ActiveChallenge';

import ChallengeGroup from '../models/ChallengeGroup';

// @route   GET /api/groups/my-groups
// @desc    Get all groups the user is part of, including member details
router.get('/my-groups', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const todayStr = getTodayStr();

  try {
    // Query both Group and ChallengeGroup collections for complete backwards compatibility
    const [rawGroups, rawChallengeGroups] = await Promise.all([
      Group.find({ $or: [{ members: userId }, { 'members.userId': userId }] })
        .populate('members', 'displayName email')
        .populate('members.userId', 'displayName email')
        .exec(),
      ChallengeGroup.find({ $or: [{ members: userId }, { creatorId: userId }] })
        .populate('members', 'displayName email')
        .populate('creatorId', 'displayName email')
        .exec()
    ]);

    // Normalize all groups into a unified structure
    const allGroups = [
      ...rawGroups.map((g: any) => ({
        _id: g._id,
        name: g.name,
        joinCode: g.joinCode,
        challengeTemplateId: g.challengeTemplateId,
        wagerAmount: g.wagerAmount,
        createdAt: g.createdAt,
        rawMembers: (g.members || []).map((m: any) => m.userId || m)
      })),
      ...rawChallengeGroups.map((cg: any) => ({
        _id: cg._id,
        name: cg.name,
        joinCode: (cg as any).joinCode || '',
        challengeTemplateId: cg._id,
        wagerAmount: 0,
        createdAt: cg.createdAt,
        rawMembers: (cg.members || []).map((m: any) => m.userId || m)
      }))
    ];

    // Deduplicate by group _id string
    const uniqueGroupsMap = new Map();
    for (const g of allGroups) {
      uniqueGroupsMap.set(g._id.toString(), g);
    }
    const uniqueGroups = Array.from(uniqueGroupsMap.values());

    const enrichedGroups = await Promise.all(uniqueGroups.map(async (group) => {
      const enrichedMembers = await Promise.all(group.rawMembers.map(async (member: any) => {
        if (!member) return null;
        const memberUserId = member._id ? member._id.toString() : member.toString();

        let objectIdMember: any = null;
        try {
          objectIdMember = new mongoose.Types.ObjectId(memberUserId);
        } catch (e) {}

        const queryIds = objectIdMember ? [memberUserId, objectIdMember] : [memberUserId];

        // Check if member has an active challenge matching string or ObjectId
        const activeCh = await ActiveChallenge.findOne({
          userId: { $in: queryIds },
          status: 'active'
        });

        if (!activeCh) {
          return null; // Exclude unaccepted invited friends!
        }

        const memberTasks = activeCh.tasks || [];
        const totalTasks = memberTasks.length > 0 ? memberTasks.length : 8;

        const logs = await DailyLog.find({ userId: memberUserId }).sort({ date: -1 });
        let streak = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (let i = 0; i < logs.length; i++) {
          if (logs[i].completedTaskIds.length >= totalTasks) {
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

        // Fetch today's log & completed tasks list
        const todayLog = logs.find(l => l.date === todayStr);
        const completedTaskIds = todayLog?.completedTaskIds || [];
        const todayCompleted = completedTaskIds.length;

        // Return details for friend inspection
        const taskDetails = memberTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          completed: completedTaskIds.includes(t.id)
        }));

        return {
          userId: {
            _id: member._id || memberUserId,
            displayName: member.displayName || 'Athlete',
            email: member.email || ''
          },
          joinedAt: group.createdAt,
          streak,
          todayCompleted,
          totalTasks,
          taskDetails
        };
      }));

      // Filter out nulls (unaccepted invited friends)
      const validMembers = enrichedMembers.filter(m => m !== null);

      return {
        _id: group._id,
        name: group.name,
        joinCode: group.joinCode,
        challengeTemplateId: group.challengeTemplateId,
        wagerAmount: group.wagerAmount,
        members: validMembers
      };
    }));

    res.json(enrichedGroups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching groups' });
  }
});

import Notification from '../models/Notification';

// @route   POST /api/groups/invite-friends
// @desc    Invite friends to active challenge group anytime
router.post('/invite-friends', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { friendIds } = req.body;

  if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one friend to invite.' });
  }

  try {
    const user = await User.findById(userId);
    let group = await Group.findOne({ members: userId }).sort({ createdAt: -1 });
    const activeCh = await ActiveChallenge.findOne({ userId, status: 'active' });

    if (!group && activeCh) {
      group = await Group.create({
        name: `${user?.displayName || 'Athlete'}'s Crew`,
        challengeTemplateId: activeCh._id as any,
        startDate: activeCh.startDate,
        members: [userId as any],
        wagerPot: 0
      });
    }

    const groupId = group ? group._id : null;

    for (const friendId of friendIds) {
      await Notification.create({
        userId: friendId,
        type: 'group_invite',
        message: `${user?.displayName || 'A friend'} invited you to join their ${activeCh?.durationDays || 75}-Day Challenge!`,
        relatedData: {
          groupId,
          durationDays: activeCh?.durationDays || 75,
          tasks: activeCh?.tasks || [],
          inviterName: user?.displayName
        }
      });
    }

    res.json({ message: 'Invites sent successfully!', groupId });
  } catch (error: any) {
    console.error('Invite friends error:', error);
    res.status(500).json({ error: error.message || 'Failed to send invites' });
  }
});

export default router;
