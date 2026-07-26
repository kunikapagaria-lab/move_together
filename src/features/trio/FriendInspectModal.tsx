import { X, CheckCircle, Circle } from 'lucide-react';

export const FriendInspectModal = ({
  isOpen,
  onClose,
  member
}: {
  isOpen: boolean;
  onClose: () => void;
  member: any;
}) => {
  if (!isOpen || !member) return null;

  const taskDetails = member.taskDetails || [];
  const completedCount = member.todayCompleted || 0;
  const totalTasks = member.totalTasks || 8;
  const percentage = Math.round((completedCount / totalTasks) * 100);

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-left shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg text-lg">
              {member.userId?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {member.userId?.displayName}'s Progress
              </h3>
              <p className="text-xs text-white/50">{member.userId?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{member.streak || 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-0.5">Day Streak ⚡</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{percentage}%</p>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-0.5">Today ({completedCount}/{totalTasks})</p>
          </div>
        </div>

        {/* Daily Checklist Breakdown */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Daily Task Checklist</h4>
          {taskDetails.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-xs text-white/50">
              No custom task breakdown available. Total: {completedCount}/{totalTasks} completed.
            </div>
          ) : (
            <div className="space-y-2">
              {taskDetails.map((t: any) => (
                <div
                  key={t.id || t.title}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    t.completed
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {t.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/30 shrink-0" />
                    )}
                    <span className={`text-xs font-bold ${t.completed ? 'text-white' : 'text-white/60'}`}>
                      {t.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    t.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/40'
                  }`}>
                    {t.completed ? 'DONE' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl border border-white/20 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
