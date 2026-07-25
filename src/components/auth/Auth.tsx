import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      let data;
      if (isLogin) {
        data = await api.login({ email, password });
      } else {
        data = await api.register({ email, password, displayName });
      }

      dispatch(loginSuccess(data));
      showSuccess(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.message || 'Authentication failed. Please check your credentials.';
      dispatch(loginFailure(errorMsg));
      showError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {/* Dynamic Space Background */}
      <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50 text-center">
          
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
              <Flame className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-3xl tracking-wide font-bold text-white uppercase mb-2">
            {isLogin ? 'Welcome Back' : 'Start Your Journey'}
          </h2>
          <p className="text-sm text-white/50 mb-8">
            {isLogin ? 'Enter your details to continue' : 'Create an account to track your progress'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Display Name" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/30 transition-all text-sm"
              />
            )}
            
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/30 transition-all text-sm"
            />
            
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/30 transition-all text-sm"
            />

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white text-black font-bold uppercase tracking-widest text-sm py-3.5 rounded-2xl hover:bg-white/90 transition-all mt-4 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-xs text-white/50">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:underline font-semibold"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
