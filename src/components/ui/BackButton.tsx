import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)}
      className="absolute top-24 left-4 sm:left-8 z-40 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full p-2 text-white/70 hover:text-white transition-all group"
      aria-label="Go Back"
    >
      <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
    </button>
  );
};
