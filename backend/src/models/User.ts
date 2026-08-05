import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  displayName: string;
  password?: string; // Optional for OAuth users
  authProviderId: string; // E.g. Google sub ID or "local"
  avatar?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferences: {
    coachStyle: 'tough-love' | 'gentle' | 'zen';
    notificationsEnabled: boolean;
  };
  points: number;
  level: number;
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed password for local auth
    displayName: { type: String, required: true },
    authProviderId: { type: String, required: true },
    avatar: { type: String },
    fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    preferences: {
      coachStyle: { 
        type: String, 
        enum: ['tough-love', 'gentle', 'zen'], 
        default: 'tough-love' 
      },
      notificationsEnabled: { type: Boolean, default: true },
    },
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    stravaAccessToken: { type: String },
    stravaRefreshToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
