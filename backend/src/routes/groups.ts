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

  if (!joinCode || typeof joinCode !== 'string') {
    return res.status(400).json({ error: 'Please provide a join code' });
  }

  try {
    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    if (group.members.some((m: any) => m.toString() === userId)) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    group.members.push(userId as any);
    await group.save();

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error joining group' });
  }
});

import DailyLog from '../models/DailyLog';
import { getTodayStr } from '../utils/dateUtils';

import ActiveChallenge from '../models/ActiveChallenge';

import ChallengeGroup from '../models/ChallengeGroup';

// @route   GET /api/groups/my-groups
// @desc    Get all groups the user is part of, including member details
router.get('/my-groups', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const todayStr = getTodayStr();

  try {
    // ChallengeGroup is the single source of truth for crews (see /challenges/start).
    // The legacy Group model is only used by the old, currently-unreachable
    // join-by-code feature and is intentionally not surfaced here anymore - returning
    // both used to produce two separate entries for what is really one crew.
    const rawChallengeGroups = await ChallengeGroup.find({
      $or: [{ members: userId }, { creatorId: userId }],
      isActive: true
    })
      .populate('members', 'displayName email')
      .populate('creatorId', 'displayName email')
      .exec();

    const uniqueGroups = rawChallengeGroups.map((cg: any) => ({
      _id: cg._id,
      name: cg.name,
      createdAt: cg.createdAt,
      rawMembers: (cg.members || []).map((m: any) => m.userId || m)
    }));

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
        const memberTaskIds = memberTasks.map((t: any) => t.id);
        const frozenDates: string[] = (activeCh as any).frozenDates || [];

        // Only count completions that match a task actually on the member's
        // current list - a log can carry stale ids from before they customized
        // their tasks down, which previously inflated counts past the current
        // total (e.g. showing "8/6 Completed").
        const logs = await DailyLog.find({ userId: memberUserId }).sort({ date: -1 });
        let streak = 0;

        for (let i = 0; i < logs.length; i++) {
          const validCompletedCount = (logs[i].completedTaskIds || []).filter((id: string) => memberTaskIds.includes(id)).length;
          if (validCompletedCount >= totalTasks) {
            streak++;
          } else if (logs[i].date === todayStr || frozenDates.includes(logs[i].date)) {
            // Today (not over yet) or a Streak-Freeze-protected day - don't break
            // the streak over it, but don't count it as a completed day either.
            continue;
          } else {
            break;
          }
        }

        // Fetch today's log & completed tasks list
        const todayLog = logs.find(l => l.date === todayStr);
        const completedTaskIds = (todayLog?.completedTaskIds || []).filter((id: string) => memberTaskIds.includes(id));
        const todayCompleted = Math.min(completedTaskIds.length, totalTasks);

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
    const activeCh = await ActiveChallenge.findOne({ userId, status: 'active' });
    if (!activeCh) {
      return res.status(400).json({ error: 'No active challenge to invite friends to.' });
    }

    let challengeGroup = await ChallengeGroup.findOne({
      $or: [{ members: userId }, { creatorId: userId }],
      isActive: true
    }).sort({ createdAt: -1 });
    if (!challengeGroup) {
      challengeGroup = await ChallengeGroup.create({
        name: `${user?.displayName || 'Athlete'}'s Crew`,
        creatorId: userId,
        members: [userId as any],
        durationDays: activeCh.durationDays,
        tasks: activeCh.tasks,
        startDate: activeCh.startDate,
        isActive: true
      });
    }

    const challengeGroupId = challengeGroup._id;

    for (const friendId of friendIds) {
      await Notification.create({
        userId: friendId,
        type: 'group_invite',
        message: `${user?.displayName || 'A friend'} invited you to join their ${activeCh.durationDays || 75}-Day Challenge!`,
        relatedData: {
          challengeGroupId,
          durationDays: activeCh.durationDays || 75,
          tasks: activeCh.tasks || [],
          inviterName: user?.displayName
        }
      });
    }

    res.json({ message: 'Invites sent successfully!', challengeGroupId });
  } catch (error: any) {
    console.error('Invite friends error:', error);
    res.status(500).json({ error: error.message || 'Failed to send invites' });
  }
});

export default router;
