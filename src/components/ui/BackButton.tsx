import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 mb-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-all group cursor-pointer"
      aria-label="Go Back"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      <span>Back</span>
    </button>
  );
};
