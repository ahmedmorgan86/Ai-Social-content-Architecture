import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, View } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Admin } from './components/Admin';
import { Sidebar } from './components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await updateDoc(doc(db, 'users', profile.uid), updates);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-12 h-12 text-zinc-100" />
        </motion.div>
        <p className="text-zinc-500 font-medium animate-pulse">جاري تشغيل المهندس المعماري...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${profile?.preferences.theme === 'light' ? 'bg-zinc-50 text-zinc-950' : 'bg-zinc-950 text-zinc-100'}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <span className="font-black tracking-tighter text-xl hidden sm:block">المهندس</span>
          </div>
          <Auth user={profile} loading={loading} onProfileUpdate={setProfile} />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 md:pl-32 lg:pl-64 max-w-7xl mx-auto">
        {!profile ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                مستقبل <br />
                <span className="text-zinc-500 italic">صناعة المحتوى</span>
              </h2>
              <p className="text-zinc-500 text-lg max-w-xl mx-auto">
                انضم إلى نخبة المبدعين الذين يستخدمون الذكاء الاصطناعي للسيطرة على وسائل التواصل الاجتماعي. 
                سجل الدخول لبدء بناء إمبراطوريتك.
              </p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-4">
              {['أفكار ذكية', 'سيناريوهات فيروسية', 'تقويم تلقائي', 'تحليل الاتجاهات'].map((feature) => (
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
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentView === 'dashboard' && <Dashboard user={profile} />}
                {currentView === 'history' && <History user={profile} />}
                {currentView === 'profile' && <Profile user={profile} onUpdate={handleProfileUpdate} />}
                {currentView === 'admin' && profile.role === 'admin' && <Admin />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-0" />
    </div>
  );
}
