import cron from 'node-cron';
import ActiveChallenge from '../models/ActiveChallenge';
import DailyLog from '../models/DailyLog';
import Notification from '../models/Notification';
import { getDateStrDaysAgo, toISTDateStrFrom } from '../utils/dateUtils';

export const startCronJobs = () => {
  // Runs at IST midnight (the app's user base's timezone), not the server's own
  // timezone - the server (e.g. Render, which runs on UTC) would otherwise
  // evaluate "yesterday" up to 5.5 hours after a user's actual local midnight,
  // wrongly judging a day they hadn't even finished yet.
  cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight reset check...');

    try {
      // 1. Get all active challenges
      const activeChallenges = await ActiveChallenge.find({ status: 'active' });

      const yesterdayStr = getDateStrDaysAgo(1);

      // 2. Check if they completed all tasks yesterday
      for (const challenge of activeChallenges) {
        // If the challenge started today (IST), skip them - they haven't had a
        // chance to fail yesterday yet.
        const startDateStr = toISTDateStrFrom(challenge.startDate);
        if (startDateStr > yesterdayStr) {
          continue; // They started today or in the future
        }

        const requiredTasksCount = challenge.tasks.length;
        const taskIds = (challenge.tasks as any[]).map(t => t.id);

        // Fetch yesterday's log for this challenge
        const log = await DailyLog.findOne({
          userId: challenge.userId,
          activeChallengeId: challenge._id,
          date: yesterdayStr
        });

        // Only count completions matching a task currently on the challenge - a
        // log can carry stale ids from before tasks were customized, which
        // could otherwise wrongly fail (or wrongly spare) someone.
        const validCompletedCount = log ? (log.completedTaskIds || []).filter(id => taskIds.includes(id)).length : 0;

        // If yesterday was a frozen date, skip failure (protected by Streak Freeze)
        const frozenDates: string[] = (challenge as any).frozenDates || [];
        if (frozenDates.includes(yesterdayStr)) {
          console.log(`Challenge ${challenge._id} for user ${challenge.userId} was frozen on ${yesterdayStr}. Skipping failure.`);
          continue;
        }

        if (validCompletedCount < requiredTasksCount) {
          challenge.status = 'failed';
          await challenge.save();
          console.log(`Challenge ${challenge._id} for user ${challenge.userId} marked as failed.`);

          // Push a notification to the user
          await Notification.create({
            userId: challenge.userId,
            type: 'failed',
            message: `You missed a task yesterday. Your challenge has been reset. Don't give up, start again today!`
          });
        }
      }
    } catch (error) {
      console.error('Error in midnight cron job:', error);
    }
  }, { timezone: 'Asia/Kolkata' });
};
