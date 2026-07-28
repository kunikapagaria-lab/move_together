import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'failed' | 'group_invite' | 'nudge' | 'cheer';
  message: string;
  relatedData?: any; // e.g. ChallengeGroupId for invites
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['failed', 'group_invite', 'nudge', 'cheer'], required: true },
    message: { type: String, required: true },
    relatedData: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
