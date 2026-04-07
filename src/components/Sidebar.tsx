import React from 'react';
import { View } from '../types';
import { LayoutDashboard, History, User, Shield, Sparkles, DollarSign, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { GoogleAd } from './GoogleAd';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
  theme: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isAdmin, theme }) => {
  const items = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'schedule', label: 'المجدولة', icon: Clock },
    { id: 'profile', label: 'الإعدادات', icon: User },
  ];

  if (isAdmin) {
    items.push({ id: 'admin', label: 'الإدارة', icon: Shield });
  }

  const getSidebarClasses = () => {
    switch (theme) {
      case 'light': return 'bg-white/80 border-zinc-200';
      case 'emerald': return 'bg-emerald-900/80 border-emerald-800';
      case 'rose': return 'bg-rose-900/80 border-rose-800';
      case 'amber': return 'bg-amber-900/80 border-amber-800';
      case 'blue': return 'bg-blue-900/80 border-blue-800';
      default: return 'bg-zinc-900/80 border-zinc-800';
    }
  };

  const getButtonClasses = (active: boolean) => {
    if (active) {
      return theme === 'light' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-950';
    }
    return theme === 'light' ? 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800';
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 md:top-1/2 md:-translate-y-1/2 z-50">
      <div className={cn("flex md:flex-col items-center gap-2 p-2 backdrop-blur-xl border rounded-full md:rounded-3xl shadow-2xl transition-colors duration-500", getSidebarClasses())}>
        <div className={cn("hidden md:flex p-3 mb-2", theme === 'light' ? 'text-zinc-950' : 'text-zinc-100')}>
          <Sparkles className="w-6 h-6" />
        </div>
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "p-4 rounded-full transition-all flex items-center gap-3 group relative",
              getButtonClasses(currentView === item.id)
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="hidden lg:block font-bold text-sm pr-2">{item.label}</span>
            {currentView === item.id && (
              <motion.div 
                layoutId="active-indicator"
                className={cn("absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full hidden md:block", theme === 'light' ? 'bg-zinc-950' : 'bg-zinc-100')}
              />
            )}
          </motion.button>
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
