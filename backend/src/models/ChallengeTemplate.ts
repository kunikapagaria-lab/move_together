import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskDefinition {
  id: string;
  title: string;
  iconName: string; // E.g., 'Flame', 'Droplets', 'BookText'
  color: string;
}

export interface IChallengeTemplate extends Document {
  title: string;
  description: string;
  durationDays: number;
  isPublic: boolean;
  creatorId?: mongoose.Types.ObjectId; // Null if it's a system default challenge
  tasks: ITaskDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskDefinitionSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  iconName: { type: String, required: true },
  color: { type: String, required: true },
});

const ChallengeTemplateSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    durationDays: { type: Number, required: true },
    isPublic: { type: Boolean, default: false },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    tasks: [TaskDefinitionSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IChallengeTemplate>('ChallengeTemplate', ChallengeTemplateSchema);
