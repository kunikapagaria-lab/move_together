import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, RefreshCw, Trash2, Eye } from 'lucide-react';

interface PhotoUploadProps {
  onComplete: () => void;
  isTaskCompleted: boolean;
}

export const PhotoUpload = ({ onComplete, isTaskCompleted: _isTaskCompleted }: PhotoUploadProps) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    return localStorage.getItem('today_progress_photo') || null;
  });
  const [visibility, setVisibility] = useState<'private' | 'group'>('private');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (photoUrl) {
      localStorage.setItem('today_progress_photo', photoUrl);
    } else {
      localStorage.removeItem('today_progress_photo');
    }
  }, [photoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoUrl(result);
        onComplete();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(null);
  };

  return (
    <div className="space-y-4 mb-4">
      {/* Hidden Native File & Camera Input */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {photoUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl group">
          <img src={photoUrl} alt="Progress" className="w-full h-56 object-cover transition-transform group-hover:scale-105" />
          
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">
            {visibility === 'private' ? '🔒 Private' : '👥 Shared with Crew'}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" /> Today's Photo Saved
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Replace Photo
                </button>
                
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="bg-rose-500/30 hover:bg-rose-500/50 border border-rose-500/40 text-rose-200 font-bold text-xs p-1.5 rounded-xl transition-all active:scale-95"
                  title="Remove Photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleOpenPicker}
          className="border-2 border-dashed border-white/20 hover:border-indigo-400/80 transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-white/[0.02] hover:bg-indigo-500/[0.05] group"
        >
          <div className="h-14 w-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Camera className="h-7 w-7" />
          </div>
          <p className="text-white font-bold text-base tracking-tight">Tap to Take or Choose Photo</p>
          <p className="text-xs text-white/40 mt-1">Select any image from your device gallery or camera</p>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
        <div>
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-400" /> Photo Privacy
          </p>
          <p className="text-[10px] text-white/40">Choose who can view this photo</p>
        </div>
        <select 
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'private' | 'group')}
          className="bg-black/40 border border-white/20 text-xs font-bold text-white rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 transition-all cursor-pointer"
        >
          <option value="private" className="bg-[#14121f]">Private (Only Me)</option>
          <option value="group" className="bg-[#14121f]">Shared with Crew</option>
        </select>
      </div>

      {!photoUrl && (
        <button
          type="button"
          onClick={handleOpenPicker}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.01] active:scale-95 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Camera className="h-4 w-4" /> Open Camera / Choose File
        </button>
      )}
    </div>
  );
};
