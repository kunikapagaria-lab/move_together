import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_AVATARS = ['🏃', '🔥', '⚡', '🏆', '🌱', '👑', '🥊', '🚴'];

// Generate JWT
const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  let { displayName, email, password } = req.body;

  if (!displayName || !email || !password) {
    return res.status(400).json({ error: 'Please include all fields' });
  }

  email = String(email).toLowerCase().trim();
  displayName = String(displayName).trim();

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (displayName.length < 1 || displayName.length > 40) {
    return res.status(400).json({ error: 'Display name must be between 1 and 40 characters' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  let hashedPassword = '';
  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in!' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);

    // Create user with unique authProviderId for local accounts
    const user = await User.create({
      displayName,
      email,
      password: hashedPassword,
      authProviderId: `local_${email}`,
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id.toString()),
      });
    } else {
      return res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      if (error.keyPattern?.email || error.message?.includes('email')) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in!' });
      }
      // If index error on old authProviderId index, retry with timestamp ID
      try {
        const fallbackUser = await User.create({
          displayName,
          email,
          password: hashedPassword,
          authProviderId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        });
        return res.status(201).json({
          _id: fallbackUser._id,
          displayName: fallbackUser.displayName,
          email: fallbackUser.email,
          avatar: fallbackUser.avatar,
          token: generateToken(fallbackUser._id.toString()),
        });
      } catch (retryErr: any) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in!' });
      }
    }
    return res.status(500).json({ error: 'Server error creating account' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate a user
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password' });
  }

  email = String(email).toLowerCase().trim();

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change the logged-in user's password
router.put('/change-password', protect, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Please provide your current and new password' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.password) {
      return res.status(404).json({ error: 'User not found' });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// @route   PUT /api/auth/update-avatar
// @desc    Update the logged-in user's avatar
router.put('/update-avatar', protect, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { avatar } = req.body;

  if (!ALLOWED_AVATARS.includes(avatar)) {
    return res.status(400).json({ error: 'Invalid avatar selection' });
  }

  try {
    const user = await User.findByIdAndUpdate(userId, { avatar }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Server error updating avatar' });
  }
});

export default router;
