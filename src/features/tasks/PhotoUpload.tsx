import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, CheckCircle2, Trash2, Eye, X, Zap } from 'lucide-react';

interface PhotoUploadProps {
  onComplete: () => void;
  isTaskCompleted: boolean;
}

export const PhotoUpload = ({ onComplete, isTaskCompleted: _isTaskCompleted }: PhotoUploadProps) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    return localStorage.getItem('today_progress_photo') || null;
  });
  const [visibility, setVisibility] = useState<'private' | 'group'>('private');
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (photoUrl) {
      localStorage.setItem('today_progress_photo', photoUrl);
    } else {
      localStorage.removeItem('today_progress_photo');
    }
  }, [photoUrl]);

  // Clean up camera stream on unmount or close
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

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

  const handleOpenGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleTriggerNativeCamera = () => {
    // Try in-app WebRTC camera first
    startLiveCamera();
  };

  const startLiveCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      setIsLiveCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err: any) {
      console.warn('In-app camera stream unavailable, falling back to native camera input:', err);
      // Fallback to native OS camera input with capture="environment"
      cameraInputRef.current?.click();
    }
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
      onComplete();
      stopCameraStream();
      setIsLiveCameraOpen(false);
    }
  };

  const handleCloseCameraModal = () => {
    stopCameraStream();
    setIsLiveCameraOpen(false);
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(null);
  };

  return (
    <div className="space-y-4 mb-4">
      {/* Hidden Gallery Input */}
      <input 
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hidden Native Direct Camera Input (forces phone camera launch) */}
      <input 
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Live Camera Viewfinder Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4">
          <div className="w-full flex items-center justify-between pt-2 px-2">
            <span className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Live Camera
            </span>
            <button 
              onClick={handleCloseCameraModal}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full max-w-md aspect-[3/4] bg-black rounded-3xl overflow-hidden relative border border-white/20 shadow-2xl my-auto">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <div className="pb-6 flex flex-col items-center gap-3">
            <button
              onClick={handleSnapPhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center hover:scale-105 active:scale-90 transition-all cursor-pointer"
              title="Snap Photo"
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-300" />
            </button>
            <span className="text-[10px] text-white/50 tracking-wide uppercase font-bold">Tap Shutter to Capture</span>
          </div>
        </div>
      )}

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
                  onClick={handleTriggerNativeCamera}
                  className="bg-indigo-500/80 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
                >
                  <Camera className="h-3.5 w-3.5" /> Re-take
                </button>

                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Replace
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
        <div className="grid grid-cols-2 gap-3">
          {/* Button 1: Take Photo with Camera */}
          <button
            type="button"
            onClick={handleTriggerNativeCamera}
            className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-400 transition-all rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-indigo-500/[0.04] hover:bg-indigo-500/[0.1] group"
          >
            <div className="h-12 w-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Camera className="h-6 w-6" />
            </div>
            <p className="text-white font-bold text-xs">Take Photo</p>
            <p className="text-[10px] text-white/40 mt-0.5">Use Live Camera</p>
          </button>

          {/* Button 2: Choose from Gallery */}
          <button
            type="button"
            onClick={handleOpenGallery}
            className="border-2 border-dashed border-white/10 hover:border-purple-400/80 transition-all rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-white/[0.02] hover:bg-purple-500/[0.05] group"
          >
            <div className="h-12 w-12 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-white font-bold text-xs">Choose Photo</p>
            <p className="text-[10px] text-white/40 mt-0.5">From Device Gallery</p>
          </button>
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
    </div>
  );
};
