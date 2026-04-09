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
import { Zap, Sparkles } from 'lucide-react';
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
    return 'bg-surface text-on-surface';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"></div>
          <Zap className="w-16 h-16 text-primary relative z-10" />
        </motion.div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-headline font-black tracking-tighter text-on-surface uppercase">محتوى AI</h2>
          <p className="text-on-surface-variant font-medium text-sm animate-pulse">جاري تشغيل محرك الذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-body relative overflow-hidden ${getThemeClasses()}`}>
      {/* Background Orbs (Liquid Design) */}
      <div className="liquid-blur bg-primary/10 w-[600px] h-[600px] -top-48 -left-48"></div>
      <div className="liquid-blur bg-secondary-container/10 w-[500px] h-[500px] top-1/2 -right-32"></div>
      <div className="liquid-blur bg-tertiary-container/10 w-[400px] h-[400px] bottom-10 left-1/4"></div>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/10">
        <div className="lg:pr-72 transition-all duration-500">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group cursor-pointer hover:scale-105 transition-all">
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-headline font-black text-2xl tracking-tighter text-on-surface">محتوى AI</span>
                <span className="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-primary">Intelligence</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end -space-y-1">
                <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">مرحباً بك</span>
                <span className="text-sm font-headline font-bold text-on-surface">{profile?.displayName || 'ضيف'}</span>
              </div>
              <Auth user={profile} loading={loading} onProfileUpdate={setProfile} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-32 lg:pr-72 min-h-screen relative z-10 transition-all duration-500">
        <div className="px-4 max-w-7xl mx-auto">
          {!profile ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-5xl md:text-7xl font-headline font-black tracking-tighter leading-none text-on-surface">
              مستقبل <br />
              <span className="text-primary italic">استراتيجية المحتوى</span>
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto font-body">
              انضم إلى نخبة المبدعين الذين يستخدمون محتوى AI للسيطرة على المشهد الرقمي.
              سجل دخولك الآن للبدء في بناء إمبراطوريتك بدقة مدعومة بالبيانات.
            </p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-4">
              {['أفكار ذكية', 'سيناريوهات فيروسية', 'تقويم تلقائي', 'تحليل التوجهات'].map((feature) => (
                <div key={feature} className="px-6 py-3 bg-surface-container-low border border-outline-variant/20 rounded-full text-xs font-bold text-on-surface-variant uppercase tracking-widest font-label">
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
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className="w-full"
              >
                <ErrorBoundary>
                  {currentView === 'dashboard' && <Dashboard user={profile} />}
                  {currentView === 'history' && <History user={profile} />}
                  {currentView === 'schedule' && <Schedule user={profile} />}
                  {currentView === 'profile' && <Profile user={profile} onUpdate={handleProfileUpdate} />}
                  {currentView === 'admin' && profile.role === 'admin' && <Admin user={profile} />}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-outline-variant/10 relative z-10 bg-surface-container-lowest">
        <div className="lg:pr-72 transition-all duration-500">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-headline font-black text-xl tracking-tighter text-on-surface">محتوى AI</span>
              </div>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                المنصة المتكاملة لصناعة المحتوى الرقمي باستخدام أحدث تقنيات الذكاء الاصطناعي.
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-on-surface font-bold">Ahmed Morgan {new Date().getFullYear()} &copy;</p>
              <p className="text-[10px] text-outline-variant font-label font-bold uppercase tracking-widest mt-1">جميع الحقوق محفوظة</p>
            </div>

            <div className="flex justify-end gap-8">
              <a href="#" className="text-xs font-label font-bold text-outline-variant hover:text-primary transition-colors uppercase tracking-widest">الخصوصية</a>
              <a href="#" className="text-xs font-label font-bold text-outline-variant hover:text-primary transition-colors uppercase tracking-widest">الشروط</a>
              <a href="#" className="text-xs font-label font-bold text-outline-variant hover:text-primary transition-colors uppercase tracking-widest">تواصل معنا</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
