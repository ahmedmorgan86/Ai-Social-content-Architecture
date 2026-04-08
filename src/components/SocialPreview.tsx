import React from 'react';
import { User, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Instagram, Twitter, Linkedin, Facebook, Youtube, MessageSquare, Pin, Ghost, Check, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface SocialPreviewProps {
  displayName: string;
  photoURL?: string | null;
  caption: string;
  hashtags: string[];
  niche: string;
  platform?: string;
  onSave?: () => void;
  isSaving?: boolean;
  onSchedule?: () => void;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({ 
  displayName, 
  photoURL, 
  caption, 
  hashtags,
  niche, 
  platform = 'Instagram',
  onSave,
  isSaving,
  onSchedule
}) => {
  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'tiktok': return <div className="w-4 h-4 bg-zinc-100 rounded-full flex items-center justify-center"><span className="text-[8px] font-black text-black">T</span></div>;
      case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'x': return <Twitter className="w-4 h-4 text-zinc-100" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
      case 'threads': return <MessageSquare className="w-4 h-4 text-zinc-100" />;
      case 'pinterest': return <Pin className="w-4 h-4 text-red-500" />;
      case 'snapchat': return <Ghost className="w-4 h-4 text-yellow-400" />;
      default: return <Instagram className="w-4 h-4 text-zinc-500" />;
    }
  };

  const isTikTok = platform.toLowerCase() === 'tiktok';

  if (isTikTok) {
    return (
      <div className="w-full max-w-[320px] mx-auto bg-black border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative aspect-[9/16] flex flex-col">
        {/* TikTok Video Area */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          <span className="text-zinc-700 font-black text-sm uppercase tracking-[0.2em] z-10 rotate-[-10deg]">فيديو تيك توك</span>
          
          {/* Right Side Actions */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-20">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-800">
                {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-zinc-500 m-3" />}
              </div>
              <div className="w-4 h-4 bg-red-500 rounded-full -mt-2 flex items-center justify-center text-white text-[10px] font-bold">+</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Heart className="w-8 h-8 text-white fill-white" />
              <span className="text-[10px] text-white font-bold">١٢.٥ ألف</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-8 h-8 text-white fill-white" />
              <span className="text-[10px] text-white font-bold">٤٥٦</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bookmark className="w-8 h-8 text-white fill-white" />
              <span className="text-[10px] text-white font-bold">٧٨٩</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Send className="w-8 h-8 text-white fill-white" />
              <span className="text-[10px] text-white font-bold">١٢٣</span>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-6 left-4 right-16 z-20 space-y-3">
            <div className="font-bold text-white text-sm">@{displayName?.replace(/\s+/g, '').toLowerCase() || 'user'}</div>
            <div className="text-xs text-white/90 leading-relaxed line-clamp-3">
              {caption}
              <div className="mt-1 flex flex-wrap gap-1">
                {hashtags.map((h, i) => (
                  <span key={i} className="font-bold text-white">#{h.replace('#', '')}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white">
              <div className="w-4 h-4 animate-spin">🎵</div>
              <span className="truncate">الصوت الأصلي - {displayName}</span>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="absolute top-8 left-0 right-0 flex justify-center gap-4 z-20">
            <span className="text-white/60 text-sm font-bold">متابعة</span>
            <span className="text-white text-sm font-bold border-b-2 border-white pb-1">لك</span>
          </div>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
          <button onClick={onSave} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white">
            {isSaving ? <Check className="w-4 h-4 text-green-400" /> : <Heart className="w-4 h-4" />}
          </button>
          <button onClick={onSchedule} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white">
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[320px] mx-auto bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Platform Badge */}
      <div className="absolute top-6 right-6 z-20 bg-zinc-900/80 backdrop-blur-md p-2 rounded-full border border-zinc-800 shadow-lg">
        {getPlatformIcon()}
      </div>

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-600" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-100">{displayName}</span>
            <span className="text-[10px] text-zinc-500">{niche}</span>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-zinc-600" />
      </div>

      {/* Media Placeholder */}
      <div className="aspect-square bg-zinc-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-950/50" />
        <span className="text-zinc-700 font-bold text-sm uppercase tracking-widest z-10">صورة المنشور</span>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="transition-all hover:scale-110 active:scale-95"
            >
              {isSaving ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <Heart className="w-6 h-6 text-zinc-100 hover:text-red-500 transition-colors" />
              )}
            </button>
            <MessageCircle className="w-6 h-6 text-zinc-100" />
            <Send className="w-6 h-6 text-zinc-100" />
            <button 
              onClick={onSchedule}
              className="transition-all hover:scale-110 active:scale-95 text-zinc-100 hover:text-blue-400"
              title="جدولة المنشور"
            >
              <Clock className="w-6 h-6" />
            </button>
          </div>
          <Bookmark className="w-6 h-6 text-zinc-100" />
        </div>

        {/* Likes */}
        <div className="text-xs font-bold text-zinc-100">١,٢٣٤ إعجاب</div>

        {/* Caption */}
        <div className="space-y-1">
          <p className="text-xs text-zinc-100 leading-relaxed">
            <span className="font-bold mr-2">{displayName}</span>
            {caption}
          </p>
          <div className="flex flex-wrap gap-1">
            {hashtags.map((h, i) => (
              <span key={i} className="text-xs text-blue-400 font-medium">#{h.replace('#', '')}</span>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">منذ ٢ ساعة</p>
        </div>
      </div>
    </div>
  );
};
