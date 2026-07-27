import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for a user (unread first)
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const notifications = await Notification.find({ userId }).sort({ read: 1, createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error marking notification as read' });
  }
});

import ActiveChallenge from '../models/ActiveChallenge';
import ChallengeGroup from '../models/ChallengeGroup';
import Group from '../models/Group';

// @route   POST /api/notifications/:id/respond
// @desc    Respond to a group invite notification (accept/decline)
router.post('/:id/respond', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'decline'

  try {
    const notification = await Notification.findOne({ _id: id, userId, type: 'group_invite' });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (action === 'accept') {
      // Check if user already has an active challenge
      const existing = await ActiveChallenge.findOne({ userId, status: 'active' });
      if (existing) {
        return res.status(400).json({ error: 'You already have an active challenge. Please cancel it before joining a new group.' });
      }

      // Create their active challenge matching the group
      await ActiveChallenge.create({
        userId,
        durationDays: notification.relatedData.durationDays,
        startDate: new Date(),
        tasks: notification.relatedData.tasks,
        status: 'active'
      });

      // Add user to Group and ChallengeGroup upon explicit acceptance
      if (notification.relatedData?.groupId) {
        await Group.findByIdAndUpdate(notification.relatedData.groupId, {
          $addToSet: { members: userId }
        });
        await ChallengeGroup.findByIdAndUpdate(notification.relatedData.groupId, {
          $addToSet: { members: userId }
        });
      }
    }

    // Mark notification as read
    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error responding to invite' });
  }
});

export default router;
