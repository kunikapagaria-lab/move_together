import ActiveChallenge from '../models/ActiveChallenge';
import Group from '../models/Group';
import ChallengeGroup from '../models/ChallengeGroup';
import DailyLog from '../models/DailyLog';
import { getTodayStr } from './dateUtils';

// Cancels a user's current active challenge and removes them from any crews they're
// part of, so their old crew isn't reused for their next challenge. Only deactivates
// a crew entirely once it has no members left - other members still mid-challenge
// should keep their crew. Also clears today's log so completed tasks from the
// cancelled challenge don't bleed into whatever challenge they join/start next.
export const cancelActiveChallenge = async (userId: string) => {
  const todayStr = getTodayStr();

  const challenge = await ActiveChallenge.findOneAndUpdate(
    { userId, status: 'active' },
    { status: 'cancelled' },
    { new: true }
  );

  const userGroups = await Group.find({ members: userId });
  for (const g of userGroups) {
    g.members = g.members.filter((m: any) => m.toString() !== userId) as any;
    if (g.members.length === 0) g.isActive = false;
    await g.save();
  }

  const userChallengeGroups = await ChallengeGroup.find({ $or: [{ members: userId }, { creatorId: userId }] });
  for (const cg of userChallengeGroups) {
    cg.members = cg.members.filter((m: any) => m.toString() !== userId) as any;
    if (cg.members.length === 0) cg.isActive = false;
    await cg.save();
  }

  await DailyLog.findOneAndDelete({ userId, date: todayStr });

  return challenge;
};
