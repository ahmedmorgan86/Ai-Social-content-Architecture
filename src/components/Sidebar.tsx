import React from 'react';
import { View } from '../types';
import { LayoutDashboard, History, User, Shield, Zap, DollarSign, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { GoogleAd } from './GoogleAd';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isAdmin }) => {
  const items = [
    { id: 'dashboard', label: 'الرئيسية', icon: 'explore' },
    { id: 'history', label: 'السجل', icon: 'bubble_chart' },
    { id: 'schedule', label: 'المجدولة', icon: 'add_circle' },
    { id: 'profile', label: 'الإعدادات', icon: 'person' },
  ];

  if (isAdmin) {
    items.push({ id: 'admin', label: 'الإدارة', icon: 'auto_awesome' });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-50">
        <div className="backdrop-blur-3xl bg-surface-container-low/80 border border-outline-variant/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[3rem] p-3 flex flex-col gap-2 transition-all duration-500">
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange(item.id as View)}
              className={cn(
                "flex items-center gap-4 py-4 px-6 rounded-[2rem] transition-all relative group min-w-[180px]",
                currentView === item.id 
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span 
                className="material-symbols-outlined text-[26px] transition-transform group-hover:scale-110" 
                style={{ fontVariationSettings: `'FILL' ${currentView === item.id ? 1 : 0}, 'wght' 500` }}
              >
                {item.icon}
              </span>
              <span className={cn(
                "text-sm font-headline font-bold tracking-tight transition-all",
                currentView === item.id ? "opacity-100" : "opacity-70 group-hover:opacity-100"
              )}>
                {item.label}
              </span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-nav-pill-desktop"
                  className="absolute inset-0 bg-primary/10 rounded-[2rem] -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-8 w-full z-50 flex justify-center items-center px-6 left-0 pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-3xl bg-surface-container-low/80 border border-outline-variant/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-lg rounded-[2.5rem] flex justify-around items-center p-2 transition-all duration-500">
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewChange(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-4 rounded-[2rem] transition-all relative group flex-1",
                currentView === item.id 
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span 
                className="material-symbols-outlined text-[24px] transition-transform group-hover:-translate-y-0.5" 
                style={{ fontVariationSettings: `'FILL' ${currentView === item.id ? 1 : 0}, 'wght' 500` }}
              >
                {item.icon}
              </span>
              <span className={cn(
                "text-[9px] font-label font-bold uppercase tracking-widest mt-1 transition-all",
                currentView === item.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
              )}>
                {item.label}
              </span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-nav-pill-mobile"
                  className="absolute inset-0 bg-primary/10 rounded-[2rem] -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>
    </>
  );
};
