import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  challengeTemplateId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  startDate: Date;
  isActive: boolean;
  wagerPot: number; // The total pot collected if wager mechanic is enabled
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    challengeTemplateId: { type: Schema.Types.ObjectId, ref: 'ChallengeTemplate', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    wagerPot: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IGroup>('Group', GroupSchema);
