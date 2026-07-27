import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Generate JWT
const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET || 'move_together_jwt_secret_key_2026';
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

  email = email.toLowerCase().trim();
  displayName = displayName.trim();

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
          token: generateToken(fallbackUser._id.toString()),
        });
      } catch (retryErr: any) {
        return res.status(400).json({ error: 'An account with this email already exists. Please log in!' });
      }
    }
    return res.status(500).json({ error: error.message || 'Server error creating account' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate a user
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password' });
  }

  email = email.toLowerCase().trim();

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
});

import mongoose from 'mongoose';

// @route   POST /api/auth/clear-all-data
// @desc    Wipe all collections in database for a 100% clean slate
router.post('/clear-all-data', async (req, res) => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    res.json({ message: 'Database cleared 100% clean! All users and data purged.' });
  } catch (error: any) {
    console.error('Clear DB error:', error);
    res.status(500).json({ error: error.message || 'Failed to clear database' });
  }
});

export default router;
