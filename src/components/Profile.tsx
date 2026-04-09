import React, { useState, useEffect } from 'react';
import { UserProfile, Favorite } from '../types';
import { Settings, Moon, Sun, Shield, User, Bell, Palette, Heart, Trash2, Video, FileText, Send, Cloud, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface ProfileProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

type ProfileTab = 'account' | 'favorites' | 'appearance';

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFavorites(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Favorite)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'favorites');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const removeFavorite = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `favorites/${id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'caption': return <Send className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 font-body">
      <header className="space-y-1">
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">الإعدادات</h1>
        <p className="text-on-surface-variant font-medium">إدارة حسابك وتفضيلاتك وتخصيص تجربتك.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Sidebar */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('account')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold transition-all",
              activeTab === 'account' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low"
            )}
          >
            <User className="w-5 h-5" />
            الحساب
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold transition-all",
              activeTab === 'favorites' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low"
            )}
          >
            <Heart className="w-5 h-5" />
            المفضلة
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Profile Section */}
                <section className="p-10 bg-surface-container-lowest border border-outline-variant/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative">
                      <img 
                        src={user.photoURL || ''} 
                        alt="" 
                        className="w-28 h-28 rounded-full border-4 border-white shadow-xl" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-white text-white">
                        <User className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="space-y-2 text-center sm:text-right">
                      <h3 className="text-2xl font-headline font-black text-on-surface tracking-tighter">{user.displayName}</h3>
                      <p className="text-on-surface-variant font-medium">{user.email}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-label font-bold uppercase rounded-full tracking-widest border border-primary/20">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Preferences Section */}
                <section className="p-10 bg-surface-container-lowest border border-outline-variant/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
                      <Settings className="w-6 h-6 text-primary" />
                      التفضيلات
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-label font-bold text-emerald-600 uppercase tracking-widest">مزامنة سحابية</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant">المجال الافتراضي</label>
                      <input
                        type="text"
                        value={user.preferences.niche || ''}
                        onChange={(e) => onUpdate({ preferences: { ...user.preferences, niche: e.target.value } })}
                        placeholder="مثال: لياقة بدنية، تسويق رقمي..."
                        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                      />
                      <p className="text-[10px] text-outline-variant font-medium">يتم حفظ التغييرات تلقائياً ومزامنتها عبر جميع أجهزتك.</p>
                    </div>
                  </div>
                </section>

                {/* Security Section */}
                {user.role === 'admin' && (
                  <section className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] flex items-start gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-headline font-bold text-on-surface">وصول المسؤول</h4>
                      <p className="text-on-surface-variant text-sm font-medium">لديك وصول إداري كامل للنظام. يمكنك إدارة المستخدمين والبيانات الحساسة.</p>
                    </div>
                  </section>
                )}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <section className="p-10 bg-surface-container-lowest border border-outline-variant/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-8">
                  <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
                    <Heart className="w-6 h-6 text-primary" />
                    المفضلة المحفوظة
                  </h3>

                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-container-low animate-pulse rounded-2xl border border-outline-variant/10" />)}
                      </div>
                    ) : favorites.length > 0 ? (
                      favorites.map((fav) => (
                        <motion.div 
                          key={fav.id} 
                          variants={itemVariants}
                          className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl flex items-start gap-6 group hover:bg-white hover:shadow-md transition-all"
                        >
                          <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            {getIcon(fav.type)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-label font-bold text-primary uppercase tracking-widest">{fav.niche}</span>
                              <button 
                                onClick={() => removeFavorite(fav.id)}
                                className="p-2 hover:bg-red-50 rounded-full text-outline-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{fav.content}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        variants={itemVariants}
                        className="py-20 text-center space-y-4"
                      >
                        <Heart className="w-16 h-16 mx-auto text-outline-variant opacity-10" />
                        <p className="text-on-surface-variant font-medium">لا توجد مفضلة محفوظة بعد.</p>
                      </motion.div>
                    )}
                  </motion.div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
