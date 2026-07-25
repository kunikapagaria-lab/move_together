import cron from 'node-cron';
import ActiveChallenge from '../models/ActiveChallenge';
import DailyLog from '../models/DailyLog';
import Notification from '../models/Notification';

export const startCronJobs = () => {
  // Run every night at midnight (server time)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running midnight reset check...');
    
    try {
      // 1. Get all active challenges
      const activeChallenges = await ActiveChallenge.find({ status: 'active' });

      // Calculate yesterday's date string
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');

      // 2. Check if they completed all tasks yesterday
      for (const challenge of activeChallenges) {
        // If the challenge started today, skip them (they haven't had a chance to fail yesterday)
        const startDate = new Date(challenge.startDate);
        startDate.setHours(0,0,0,0);
        yesterday.setHours(0,0,0,0);
        
        if (startDate.getTime() > yesterday.getTime()) {
           continue; // They started today or in the future
        }

        const requiredTasksCount = challenge.tasks.length;

        // Fetch yesterday's log for this challenge
        const log = await DailyLog.findOne({
          userId: challenge.userId,
          activeChallengeId: challenge._id,
          date: yesterdayStr
        });

        if (!log || log.completedTaskIds.length < requiredTasksCount) {
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
  });
};
