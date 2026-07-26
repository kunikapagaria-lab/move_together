import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Friendship from '../models/Friendship';
import User from '../models/User';

const router = express.Router();

// @route   GET /api/friends/search
// @desc    Search users by displayName or email
router.get('/search', protect, async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  if (!query || !query.trim()) return res.json([]);

  try {
    const cleanQuery = query.trim();
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const users = await User.find({
      _id: { $ne: req.user?.id },
      $or: [
        { displayName: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } }
      ]
    }).select('displayName email _id');
    
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error searching users' });
  }
});

// @route   POST /api/friends/request
// @desc    Send a friend request
router.post('/request', protect, async (req: AuthRequest, res: Response) => {
  const requesterId = req.user?.id;
  const { recipientId } = req.body;

  try {
    // Check if friendship already exists
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'Friendship or request already exists' });
    }

    const request = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    const populatedRequest = await Friendship.findById(request._id).populate('requester recipient', 'displayName email _id');

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error sending request' });
  }
});

// @route   PUT /api/friends/accept/:id
// @desc    Accept a friend request
router.put('/accept/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const request = await Friendship.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user?.id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error accepting request' });
  }
});

// @route   PUT /api/friends/reject/:id
// @desc    Reject a friend request
router.put('/reject/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const request = await Friendship.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user?.id, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error rejecting request' });
  }
});

// @route   GET /api/friends/mine
// @desc    Get my friends (and pending requests)
router.get('/mine', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const requests = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }]
    }).populate('requester recipient', 'displayName email _id');
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching friends' });
  }
});

export default router;
