import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  iconName: { type: String, default: 'CheckCircle' },
  color: { type: String, default: 'bg-indigo-500' }
});

const activeChallengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengeTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChallengeTemplate' }, // Optional reference to the template it was based on
  durationDays: { type: Number, required: true },
  startDate: { type: Date, required: true },
  tasks: [taskSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

activeChallengeSchema.index({ userId: 1, status: 1 });

export default mongoose.model('ActiveChallenge', activeChallengeSchema);
