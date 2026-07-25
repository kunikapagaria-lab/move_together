import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const consistencyData = [
  { subject: 'Water', A: 100, fullMark: 100 },
  { subject: 'Workout', A: 90, fullMark: 100 },
  { subject: 'Diet', A: 85, fullMark: 100 },
  { subject: 'Reading', A: 70, fullMark: 100 },
  { subject: 'Photo', A: 95, fullMark: 100 },
  { subject: 'Self-Care', A: 60, fullMark: 100 },
];

export const ConsistencyRadar = () => {
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-5 w-full">
      <h2 className="text-lg font-bold text-white mb-2">Consistency Profile</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={consistencyData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="You" dataKey="A" stroke="#818cf8" fill="#4f46e5" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
