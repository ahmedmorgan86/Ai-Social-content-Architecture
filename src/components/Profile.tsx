import React, { useState, useEffect } from 'react';
import { UserProfile, Favorite } from '../types';
import { Settings, Moon, Sun, Shield, User, Bell, Palette, Heart, Trash2, Video, FileText, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
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
    });

    return () => unsubscribe();
  }, [user.uid]);

  const removeFavorite = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', id));
    } catch (error) {
      console.error('Error removing favorite:', error);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-zinc-100">الإعدادات</h1>
        <p className="text-zinc-500">إدارة حسابك وتفضيلاتك.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('account')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              activeTab === 'account' ? "bg-zinc-100 text-zinc-950" : "text-zinc-500 hover:bg-zinc-900"
            )}
          >
            <User className="w-5 h-5" />
            الحساب
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              activeTab === 'favorites' ? "bg-zinc-100 text-zinc-950" : "text-zinc-500 hover:bg-zinc-900"
            )}
          >
            <Heart className="w-5 h-5" />
            المفضلة
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              activeTab === 'appearance' ? "bg-zinc-100 text-zinc-950" : "text-zinc-500 hover:bg-zinc-900"
            )}
          >
            <Palette className="w-5 h-5" />
            المظهر
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Profile Section */}
                <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
                  <div className="flex items-center gap-6">
                    <img 
                      src={user.photoURL || ''} 
                      alt="" 
                      className="w-20 h-20 rounded-full border-2 border-zinc-800 p-1" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-zinc-100">{user.displayName}</h3>
                      <p className="text-zinc-500 text-sm">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded tracking-wider">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Preferences Section */}
                <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-zinc-500" />
                    التفضيلات
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">المجال الافتراضي</label>
                      <input
                        type="text"
                        value={user.preferences.niche || ''}
                        onChange={(e) => onUpdate({ preferences: { ...user.preferences, niche: e.target.value } })}
                        placeholder="مثال: لياقة بدنية"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-zinc-700 outline-none transition-all"
                      />
                    </div>
                  </div>
                </section>

                {/* Security Section */}
                {user.role === 'admin' && (
                  <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 text-zinc-100 font-bold">
                      <Shield className="w-5 h-5 text-zinc-500" />
                      وصول المسؤول
                    </div>
                    <p className="text-zinc-500 text-sm">لديك وصول إداري كامل للنظام. كن حذراً في إدارة البيانات.</p>
                  </section>
                )}
              </motion.div>
            )}

            {activeTab === 'favorites' && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-zinc-500" />
                    المفضلة المحفوظة
                  </h3>

                  <div className="space-y-4">
                    {loading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-2xl" />)}
                      </div>
                    ) : favorites.length > 0 ? (
                      favorites.map((fav) => (
                        <div key={fav.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-start gap-4 group">
                          <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500">
                            {getIcon(fav.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{fav.niche}</span>
                              <button 
                                onClick={() => removeFavorite(fav.id)}
                                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{fav.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-zinc-600">
                        <Heart className="w-12 h-12 mx-auto opacity-10 mb-4" />
                        <p>لا توجد مفضلة محفوظة بعد.</p>
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-zinc-500" />
                    إعدادات المظهر
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-zinc-100 font-medium">الوضع الليلي</div>
                      <div className="text-zinc-500 text-sm">التبديل بين الوضع الفاتح والمظلم.</div>
                    </div>
                    <button 
                      onClick={() => onUpdate({ preferences: { ...user.preferences, theme: user.preferences.theme === 'dark' ? 'light' : 'dark' } })}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all text-zinc-100"
                    >
                      {user.preferences.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
