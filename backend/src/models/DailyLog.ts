import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyLog extends Document {
  userId: mongoose.Types.ObjectId;
  activeChallengeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  journalEntry: string;
  healthData?: {
    steps: number;
    distanceMeters: number;
    activeCalories: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    activeChallengeId: { type: Schema.Types.ObjectId, ref: 'ActiveChallenge', required: true },
    date: { type: String, required: true },
    completedTaskIds: [{ type: String }],
    journalEntry: { type: String, default: '' },
    healthData: {
      steps: { type: Number },
      distanceMeters: { type: Number },
      activeCalories: { type: Number }
    }
  },
  { timestamps: true }
);

// A user can only have one log per day per challenge
DailyLogSchema.index({ userId: 1, activeChallengeId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);
