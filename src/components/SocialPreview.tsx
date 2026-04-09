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
  hook?: string;
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
  hook,
  onSave,
  isSaving,
  onSchedule
}) => {
  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-5 h-5 text-primary" />;
      case 'tiktok': return <div className="w-5 h-5 bg-on-surface rounded-full flex items-center justify-center"><span className="text-[10px] font-black text-surface">T</span></div>;
      case 'linkedin': return <Linkedin className="w-5 h-5 text-primary" />;
      case 'x': return <Twitter className="w-5 h-5 text-primary" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-primary" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-primary" />;
      case 'threads': return <MessageSquare className="w-5 h-5 text-primary" />;
      case 'pinterest': return <Pin className="w-5 h-5 text-primary" />;
      case 'snapchat': return <Ghost className="w-5 h-5 text-primary" />;
      default: return <Instagram className="w-5 h-5 text-primary" />;
    }
  };

  const isTikTok = platform.toLowerCase() === 'tiktok';

  if (isTikTok) {
    return (
      <div className="w-full max-w-[340px] mx-auto bg-black border border-outline-variant/10 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative aspect-[9/16] flex flex-col font-body">
        {/* TikTok Video Area */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
          <div className="z-10 flex flex-col items-center gap-4 px-6 text-center">
            {hook ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-primary/90 text-white px-6 py-4 rounded-2xl font-headline font-black text-lg shadow-2xl border border-white/20 backdrop-blur-md"
              >
                {hook}
              </motion.div>
            ) : (
              <Youtube className="w-16 h-16 text-white opacity-30" />
            )}
            <span className="text-white/40 font-headline font-black text-[10px] uppercase tracking-[0.3em] rotate-[-5deg]">فيديو تيك توك</span>
          </div>
          
          {/* Right Side Actions */}
          <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-20">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-800 shadow-lg">
                {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-zinc-500 m-3" />}
              </div>
              <div className="w-5 h-5 bg-primary rounded-full -mt-3 flex items-center justify-center text-white text-[12px] font-black shadow-lg">+</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Heart className="w-9 h-9 text-white fill-white drop-shadow-lg" />
              <span className="text-[11px] text-white font-black drop-shadow-md">١٢.٥ ألف</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-9 h-9 text-white fill-white drop-shadow-lg" />
              <span className="text-[11px] text-white font-black drop-shadow-md">٤٥٦</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bookmark className="w-9 h-9 text-white fill-white drop-shadow-lg" />
              <span className="text-[11px] text-white font-black drop-shadow-md">٧٨٩</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Send className="w-9 h-9 text-white fill-white drop-shadow-lg" />
              <span className="text-[11px] text-white font-black drop-shadow-md">١٢٣</span>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-8 left-6 right-20 z-20 space-y-4">
            <div className="font-headline font-black text-white text-base tracking-tight drop-shadow-md">@{displayName?.replace(/\s+/g, '').toLowerCase() || 'user'}</div>
            <div className="text-sm text-white/95 leading-relaxed line-clamp-3 drop-shadow-md font-medium">
              {caption}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hashtags.map((h, i) => (
                  <span key={i} className="font-black text-white hover:text-primary transition-colors cursor-pointer">#{h.replace('#', '')}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/90 bg-white/10 backdrop-blur-md py-2 px-4 rounded-full w-fit border border-white/10">
              <div className="w-4 h-4 animate-spin text-primary">🎵</div>
              <span className="truncate font-bold">الصوت الأصلي - {displayName}</span>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="absolute top-10 left-0 right-0 flex justify-center gap-6 z-20">
            <span className="text-white/50 text-sm font-black tracking-tight cursor-pointer hover:text-white transition-colors">متابعة</span>
            <span className="text-white text-sm font-black tracking-tight border-b-2 border-primary pb-1 cursor-pointer">لك</span>
          </div>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute top-8 left-6 z-30 flex flex-col gap-3">
          <button onClick={onSave} className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 text-white transition-all hover:scale-110 active:scale-95 hover:bg-primary/20 hover:border-primary/30">
            {isSaving ? <Check className="w-5 h-5 text-emerald-400" /> : <Heart className="w-5 h-5" />}
          </button>
          <button onClick={onSchedule} className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 text-white transition-all hover:scale-110 active:scale-95 hover:bg-primary/20 hover:border-primary/30">
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[340px] mx-auto bg-surface-container-lowest border border-outline-variant/10 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative font-body group hover:shadow-[0_30px_70px_rgba(0,0,0,0.12)] transition-all duration-500">
      {/* Platform Badge */}
      <div className="absolute top-6 right-6 z-20 bg-surface-container-low/90 backdrop-blur-xl p-3 rounded-2xl border border-outline-variant/10 shadow-xl group-hover:scale-110 transition-transform">
        {getPlatformIcon()}
      </div>

      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant/10">
              <User className="w-5 h-5 text-outline-variant" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-headline font-black text-on-surface tracking-tight">{displayName}</span>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{niche}</span>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <MoreHorizontal className="w-5 h-5 text-outline-variant" />
        </button>
      </div>

      {/* Media Placeholder */}
      <div className="aspect-square bg-surface-container-low flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="z-10 flex flex-col items-center gap-3 opacity-20">
          <div className="w-16 h-16 rounded-3xl border-4 border-outline-variant flex items-center justify-center">
            <Send className="w-8 h-8 text-outline-variant" />
          </div>
          <span className="text-outline-variant font-headline font-black text-[10px] uppercase tracking-[0.3em]">صورة المنشور</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="transition-all hover:scale-120 active:scale-90"
            >
              {isSaving ? (
                <Check className="w-7 h-7 text-emerald-500" />
              ) : (
                <Heart className="w-7 h-7 text-on-surface hover:text-red-500 hover:fill-red-500 transition-all" />
              )}
            </button>
            <button className="transition-all hover:scale-120 active:scale-90">
              <MessageCircle className="w-7 h-7 text-on-surface hover:text-primary transition-colors" />
            </button>
            <button className="transition-all hover:scale-120 active:scale-90">
              <Send className="w-7 h-7 text-on-surface hover:text-primary transition-colors" />
            </button>
            <button 
              onClick={onSchedule}
              className="transition-all hover:scale-120 active:scale-90 text-on-surface hover:text-primary"
              title="جدولة المنشور"
            >
              <Clock className="w-7 h-7" />
            </button>
          </div>
          <button className="transition-all hover:scale-120 active:scale-90">
            <Bookmark className="w-7 h-7 text-on-surface hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Likes */}
        <div className="text-sm font-headline font-black text-on-surface tracking-tight">١,٢٣٤ إعجاب</div>

        {/* Caption */}
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
            <span className="font-headline font-black mr-2 text-on-surface tracking-tight">{displayName}</span>
            {caption}
          </p>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((h, i) => (
              <span key={i} className="text-xs text-primary font-label font-black hover:underline cursor-pointer">#{h.replace('#', '')}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-outline-variant font-label font-bold uppercase tracking-widest">منذ ٢ ساعة</p>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <div className="w-1 h-1 rounded-full bg-outline-variant/30" />
              <div className="w-1 h-1 rounded-full bg-outline-variant/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
