import React from 'react';
import { View } from '../types';
import { LayoutDashboard, History, User, Shield, Sparkles, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleAd } from './GoogleAd';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isAdmin }) => {
  const items = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'profile', label: 'الإعدادات', icon: User },
  ];

  if (isAdmin) {
    items.push({ id: 'admin', label: 'الإدارة', icon: Shield });
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 md:top-1/2 md:-translate-y-1/2 z-50">
      <div className="flex md:flex-col items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full md:rounded-3xl shadow-2xl">
        <div className="hidden md:flex p-3 text-zinc-100 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "p-4 rounded-full transition-all flex items-center gap-3 group relative",
              currentView === item.id 
                ? "bg-zinc-100 text-zinc-950" 
                : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-sm pr-2">{item.label}</span>
            {currentView === item.id && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-zinc-100 rounded-full hidden md:block" />
            )}
          </button>
        ))}

        {/* Sidebar Mini Ad */}
        <div className="hidden md:flex mt-4 p-2 w-full flex-col items-center gap-2">
          <div className="text-[8px] text-zinc-700 font-bold uppercase">Ad</div>
          <div className="w-10 h-10 bg-zinc-800/50 rounded-xl flex items-center justify-center overflow-hidden">
            <DollarSign className="w-4 h-4 text-zinc-700" />
          </div>
        </div>
      </div>
    </nav>
  );
};
