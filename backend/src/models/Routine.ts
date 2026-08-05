import mongoose from 'mongoose';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FOCUS_OPTIONS = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'rest'];

const routineCellSchema = new mongoose.Schema({
  id: { type: String, required: true },
  day: { type: String, enum: DAYS, required: true },
  timeRow: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String }
}, { _id: false });

const splitExerciseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  primaryMuscles: [{ type: String }],
  sets: { type: Number, default: 3 },
  reps: { type: String, default: '8-12' }
}, { _id: false });

const workoutSplitDaySchema = new mongoose.Schema({
  day: { type: String, enum: DAYS, required: true },
  focus: { type: String, enum: [...FOCUS_OPTIONS, null], default: null },
  exercises: [splitExerciseSchema]
}, { _id: false });

const routineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cells: [routineCellSchema],
  timeRows: [{ type: String }],
  workoutSplit: [workoutSplitDaySchema]
}, { timestamps: true });

export default mongoose.model('Routine', routineSchema);
