import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Flame } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username too long'),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export const SignUp = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    setError(null);
    
    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    if (authData.user) {
      // 2. We will handle profile creation via a database trigger in Phase 2
      // For now, MVP sign up works.
      navigate('/group-setup');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-surface p-8 shadow-xl border border-surfaceHighlight">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Flame className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Create an account</h2>
          <p className="text-textMuted">Join MOVE TOGETHER and start your journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="ironman"
              {...register('username')}
              error={errors.username?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-danger/10 p-4 text-sm text-danger border border-danger/20">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <div className="text-center text-sm text-textMuted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primaryHover transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
