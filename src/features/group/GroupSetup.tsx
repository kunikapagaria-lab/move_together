import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Users, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters'),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().min(6, 'Invite code must be at least 6 characters'),
});

export const GroupSetup = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

  const { register: registerCreate, handleSubmit: handleSubmitCreate, formState: { errors: createErrors } } = useForm({
    resolver: zodResolver(createGroupSchema),
  });

  const { register: registerJoin, handleSubmit: handleSubmitJoin, formState: { errors: joinErrors } } = useForm({
    resolver: zodResolver(joinGroupSchema),
  });

  const onCreateGroup = (data: any) => {
    console.log('Creating group (MOCKED)', data);
    navigate('/dashboard'); // Mocking navigation
  };

  const onJoinGroup = (data: any) => {
    console.log('Joining group (MOCKED)', data);
    navigate('/dashboard'); // Mocking navigation
  };

  if (mode === 'select') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-surface p-8 shadow-xl border border-surfaceHighlight text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-white">Join the Challenge</h2>
            <p className="text-textMuted">You need a group of 3 to start the 75-day journey. Create a new group or join an existing one.</p>
          </div>
          <div className="space-y-4 pt-4">
            <Button className="w-full h-14 text-lg" onClick={() => setMode('create')}>
              Create a Group
            </Button>
            <Button variant="secondary" className="w-full h-14 text-lg" onClick={() => setMode('join')}>
              Join via Invite Code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-surface p-8 shadow-xl border border-surfaceHighlight">
        <button 
          onClick={() => setMode('select')}
          className="text-sm text-textMuted hover:text-white mb-4 block"
        >
          &larr; Back
        </button>

        {mode === 'create' ? (
          <form onSubmit={handleSubmitCreate(onCreateGroup)} className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Name Your Group</h2>
            <p className="text-sm text-textMuted">Give your trio a motivating name.</p>
            <Input
              label="Group Name"
              placeholder="e.g. Unstoppable Trio"
              {...registerCreate('name')}
              error={createErrors.name?.message as string}
            />
            <Button type="submit" className="w-full">
              Create Group <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitJoin(onJoinGroup)} className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Join a Group</h2>
            <p className="text-sm text-textMuted">Enter the invite code from your friend.</p>
            <Input
              label="Invite Code"
              placeholder="e.g. X7K9-P2"
              {...registerJoin('inviteCode')}
              error={joinErrors.inviteCode?.message as string}
            />
            <Button type="submit" className="w-full">
              Join Group <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
