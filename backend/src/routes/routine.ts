import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Routine from '../models/Routine';

const router = express.Router();

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const VALID_FOCUS = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'rest', null];
const DEFAULT_TIME_ROWS = ['5:00 AM', '8:00 AM', '11:00 AM', '13:00 PM', '15:00 PM', '17:00 PM', '19:00 PM', '21:00 PM'];

// Finds a user's routine, creating an empty one if it doesn't exist yet.
// Tolerates a duplicate-key race the same way logs.ts's findOrCreateTodayLog does.
// Deliberately created EMPTY (not seeded) - the frontend's one-time migration
// relies on "cells.length === 0 && workoutSplit.length === 0" meaning "nothing
// has ever been saved for this account" to decide whether to migrate localStorage
// data up or seed fresh defaults.
const findOrCreateRoutine = async (userId: any) => {
  let routine = await Routine.findOne({ userId });
  if (routine) return routine;

  try {
    return await Routine.create({ userId, cells: [], timeRows: DEFAULT_TIME_ROWS, workoutSplit: [] });
  } catch (error: any) {
    if (error.code === 11000) {
      const existing = await Routine.findOne({ userId });
      if (existing) return existing;
    }
    throw error;
  }
};

// @route   GET /api/routine
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const routine = await findOrCreateRoutine(req.user?.id);
    res.json({ cells: routine.cells, timeRows: routine.timeRows, workoutSplit: routine.workoutSplit });
  } catch (error) {
    console.error('Error fetching routine:', error);
    res.status(500).json({ error: 'Server error fetching routine' });
  }
});

// @route   PUT /api/routine
router.put('/', protect, async (req: AuthRequest, res: Response) => {
  const { cells, timeRows, workoutSplit } = req.body;

  if (!Array.isArray(cells) || !Array.isArray(timeRows) || !Array.isArray(workoutSplit)) {
    return res.status(400).json({ error: 'cells, timeRows, and workoutSplit must be arrays' });
  }
  for (const c of cells) {
    if (!c || typeof c.id !== 'string' || !VALID_DAYS.includes(c.day) || typeof c.title !== 'string') {
      return res.status(400).json({ error: 'Each schedule cell needs a valid id, day, and title' });
    }
  }
  for (const d of workoutSplit) {
    if (!d || !VALID_DAYS.includes(d.day) || !VALID_FOCUS.includes(d.focus ?? null)) {
      return res.status(400).json({ error: 'Each workout split day needs a valid day and focus' });
    }
    if (!Array.isArray(d.exercises)) {
      return res.status(400).json({ error: 'Each workout split day needs an exercises array' });
    }
    for (const ex of d.exercises) {
      if (!ex || typeof ex.id !== 'string' || typeof ex.exerciseId !== 'string' || typeof ex.exerciseName !== 'string') {
        return res.status(400).json({ error: 'Each exercise needs a valid id, exerciseId, and exerciseName' });
      }
    }
  }

  try {
    const routine = await Routine.findOneAndUpdate(
      { userId: req.user?.id },
      { userId: req.user?.id, cells, timeRows, workoutSplit },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ cells: routine.cells, timeRows: routine.timeRows, workoutSplit: routine.workoutSplit });
  } catch (error) {
    console.error('Error saving routine:', error);
    res.status(500).json({ error: 'Server error saving routine' });
  }
});

export default router;
