import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, View } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Admin } from './components/Admin';
import { Schedule } from './components/Schedule';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await updateDoc(doc(db, 'users', profile.uid), updates);
  };

  const getThemeClasses = () => {
    const theme = profile?.preferences.theme || 'dark';
    switch (theme) {
      case 'light': return 'bg-zinc-50 text-zinc-950';
      case 'emerald': return 'bg-emerald-950 text-emerald-50';
      case 'rose': return 'bg-rose-950 text-rose-50';
      case 'amber': return 'bg-amber-950 text-amber-50';
      case 'blue': return 'bg-blue-950 text-blue-50';
      default: return 'bg-zinc-950 text-zinc-100';
    }
  };

  const getHeaderClasses = () => {
    const theme = profile?.preferences.theme || 'dark';
    switch (theme) {
      case 'light': return 'bg-white/50 border-zinc-200';
      case 'emerald': return 'bg-emerald-950/50 border-emerald-900';
      case 'rose': return 'bg-rose-950/50 border-rose-900';
      case 'amber': return 'bg-amber-950/50 border-amber-900';
      case 'blue': return 'bg-blue-950/50 border-blue-900';
      default: return 'bg-zinc-950/50 border-zinc-900';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-12 h-12 text-zinc-100" />
        </motion.div>
        <p className="text-zinc-500 font-medium animate-pulse">جاري تشغيل Vantage AI...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getThemeClasses()}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b px-6 py-4 ${getHeaderClasses()}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-zinc-950" />
            </div>
            <span className="font-black tracking-tighter text-xl hidden sm:block uppercase">Vantage AI</span>
          </div>
          <Auth user={profile} loading={loading} onProfileUpdate={setProfile} />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 md:pl-32 lg:pl-64 max-w-7xl mx-auto min-h-[calc(100vh-8rem)]">
        {!profile ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              The Future of <br />
              <span className="text-zinc-500 italic">Content Strategy</span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Join the elite creators using Vantage AI to dominate the digital landscape. 
              Sign in to start building your empire with data-driven precision.
            </p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-4">
              {['Smart Ideas', 'Viral Scripts', 'Auto Calendar', 'Trend Analysis'].map((feature) => (
                <div key={feature} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <Sidebar 
              currentView={currentView} 
              onViewChange={setCurrentView} 
              isAdmin={profile.role === 'admin'} 
              theme={profile.preferences.theme || 'dark'}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1]
                }}
              >
                <ErrorBoundary theme={profile.preferences.theme || 'dark'}>
                  {currentView === 'dashboard' && <Dashboard user={profile} theme={profile.preferences.theme || 'dark'} />}
                  {currentView === 'history' && <History user={profile} theme={profile.preferences.theme || 'dark'} />}
                  {currentView === 'schedule' && <Schedule user={profile} theme={profile.preferences.theme || 'dark'} />}
                  {currentView === 'profile' && <Profile user={profile} onUpdate={handleProfileUpdate} />}
                  {currentView === 'admin' && profile.role === 'admin' && <Admin user={profile} theme={profile.preferences.theme || 'dark'} />}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={cn(
        "py-12 px-6 md:pl-32 lg:pl-64 border-t relative z-10",
        profile?.preferences.theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-zinc-950 border-zinc-900 text-zinc-500'
      )}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="font-bold tracking-tighter uppercase">Vantage AI</span>
          </div>
          <p className="text-xs font-medium">
            Copyright Ahmed Morgan {new Date().getFullYear()} &copy;
          </p>
        </div>
      </footer>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-0" />
    </div>
  );
}
