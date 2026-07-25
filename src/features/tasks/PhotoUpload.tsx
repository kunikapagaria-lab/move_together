import { useState } from 'react';
import { Camera, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface PhotoUploadProps {
  onComplete: () => void;
  isTaskCompleted: boolean;
}

export const PhotoUpload = ({ onComplete, isTaskCompleted: _isTaskCompleted }: PhotoUploadProps) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'group'>('private');

  const handleSimulateUpload = () => {
    // In the real app, this opens the native file picker and uploads to Supabase Storage
    setPhotoUrl('https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
    onComplete();
  };

  return (
    <div className="space-y-4 mb-4">
      {photoUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-surfaceHighlight bg-surface">
          <img src={photoUrl} alt="Progress" className="w-full h-48 object-cover opacity-80" />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-lg">
            {visibility === 'private' ? 'Private' : 'Shared with Group'}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <CheckCircle2 className="h-12 w-12 text-success drop-shadow-md" />
          </div>
        </div>
      ) : (
        <div 
          onClick={handleSimulateUpload}
          className="border-2 border-dashed border-surfaceHighlight hover:border-primary transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-surface/50"
        >
          <div className="h-12 w-12 rounded-full bg-surfaceHighlight flex items-center justify-center mb-3 text-textMuted">
            <ImageIcon className="h-6 w-6" />
          </div>
          <p className="text-white font-bold">Tap to Upload</p>
          <p className="text-sm text-textMuted mt-1">Take your daily progress photo</p>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceHighlight/50 border border-surfaceHighlight">
        <div>
          <p className="text-sm font-bold text-white">Visibility</p>
          <p className="text-xs text-textMuted">Who can see this photo?</p>
        </div>
        <select 
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'private' | 'group')}
          className="bg-surface border border-surfaceHighlight text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="private">Private (Only Me)</option>
          <option value="group">Visible to Group</option>
        </select>
      </div>

      {!photoUrl && (
        <Button className="w-full" onClick={handleSimulateUpload}>
          <Camera className="mr-2 h-4 w-4" /> Open Camera
        </Button>
      )}
    </div>
  );
};
