import mongoose, { Schema, Document } from 'mongoose';

export interface IChallengeGroup extends Document {
  name: string;
  creatorId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[]; // Only accepted members
  durationDays: number;
  tasks: any[];
  startDate: Date;
  isActive: boolean;
}

const ChallengeGroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    durationDays: { type: Number, required: true },
    tasks: { type: Array, required: true },
    startDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IChallengeGroup>('ChallengeGroup', ChallengeGroupSchema);
