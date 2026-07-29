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
import User from '../models/User';
import { cancelActiveChallenge } from '../utils/challengeHelpers';

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
      // If they're already on a challenge, accepting a new invite switches them
      // over - cancel the old one (and leave its crew) first. The frontend is
      // expected to confirm this with the user before calling accept, since it
      // costs them their current progress.
      const existing = await ActiveChallenge.findOne({ userId, status: 'active' });
      if (existing) {
        await cancelActiveChallenge(userId as string);
      }

      // Create their active challenge matching the group
      await ActiveChallenge.create({
        userId,
        durationDays: notification.relatedData.durationDays,
        startDate: new Date(),
        tasks: notification.relatedData.tasks,
        status: 'active'
      });

      // Add user to Group and ChallengeGroup upon explicit acceptance.
      // These are two separate documents in two separate collections with their own
      // independent _ids - each must be looked up by its own id, not each other's.
      if (notification.relatedData?.groupId) {
        await Group.findByIdAndUpdate(notification.relatedData.groupId, {
          $addToSet: { members: userId }
        });
      }
      if (notification.relatedData?.challengeGroupId) {
        await ChallengeGroup.findByIdAndUpdate(notification.relatedData.challengeGroupId, {
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

// @route   POST /api/notifications/crew-signal
// @desc    Send a Nudge or Cheer to a crew-mate (must share an active crew)
router.post('/crew-signal', protect, async (req: AuthRequest, res: Response) => {
  const senderId = req.user?.id;
  const { recipientId, kind } = req.body;

  if (!recipientId || (kind !== 'nudge' && kind !== 'cheer')) {
    return res.status(400).json({ error: 'recipientId and a valid kind (nudge or cheer) are required' });
  }
  if (recipientId === senderId) {
    return res.status(400).json({ error: 'You cannot send a crew signal to yourself' });
  }

  try {
    // Confirm sender and recipient share an active crew
    const sharedCrew = await ChallengeGroup.findOne({
      $or: [{ members: senderId }, { creatorId: senderId }],
      members: recipientId,
      isActive: true
    });

    if (!sharedCrew) {
      return res.status(403).json({ error: 'You can only nudge or cheer members of your own crew.' });
    }

    const sender = await User.findById(senderId);
    const senderName = sender?.displayName || 'A crew-mate';

    const message = kind === 'cheer'
      ? `${senderName} sent you a Cheer! 👏`
      : `${senderName} nudged you to get moving! 🔥`;

    await Notification.create({
      userId: recipientId,
      type: kind,
      message,
      relatedData: { senderId, senderName, kind }
    });

    res.status(201).json({ message: 'Sent!' });
  } catch (error) {
    console.error('Error sending crew signal:', error);
    res.status(500).json({ error: 'Server error sending crew signal' });
  }
});

export default router;
