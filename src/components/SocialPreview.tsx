import React from 'react';
import { User, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface SocialPreviewProps {
  displayName: string;
  photoURL?: string | null;
  caption: string;
  niche: string;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({ displayName, photoURL, caption, niche }) => {
  return (
    <div className="w-full max-w-[320px] mx-auto bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
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
            <Heart className="w-6 h-6 text-zinc-100" />
            <MessageCircle className="w-6 h-6 text-zinc-100" />
            <Send className="w-6 h-6 text-zinc-100" />
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
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">منذ ٢ ساعة</p>
        </div>
      </div>
    </div>
  );
};
