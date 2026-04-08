import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, where, updateDoc } from 'firebase/firestore';
import { UserProfile, ContentGeneration } from '../types';
import { Users, BarChart3, Trash2, Shield, Search, TrendingUp, Activity, UserPlus, UserMinus, AlertTriangle, X as CloseIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AdminProps {
  user: UserProfile;
  theme: string;
}

export const Admin: React.FC<AdminProps> = ({ user, theme }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [generations, setGenerations] = useState<ContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingRoleChange, setConfirmingRoleChange] = useState<{ user: UserProfile, newRole: 'admin' | 'user' } | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubGens = onSnapshot(collection(db, 'generations'), (snapshot) => {
      setGenerations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ContentGeneration)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'generations');
    });

    return () => {
      unsubUsers();
      unsubGens();
    };
  }, []);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteDoc(doc(db, 'users', deletingUser));
      setDeletingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${deletingUser}`);
    }
  };

  const handleRoleChange = async () => {
    if (!confirmingRoleChange) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', confirmingRoleChange.user.uid), {
        role: confirmingRoleChange.newRole
      });
      setConfirmingRoleChange(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${confirmingRoleChange.user.uid}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    totalGens: generations.length,
    avgScore: generations.length > 0 
      ? Math.round(generations.reduce((acc, g) => acc + (g.results.score || 0), 0) / generations.length)
      : 0,
    topNiche: generations.length > 0
      ? Object.entries(generations.reduce((acc: any, g) => {
          acc[g.niche] = (acc[g.niche] || 0) + 1;
          return acc;
        }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]
      : 'N/A'
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSurfaceClasses = () => {
    switch (theme) {
      case 'light': return 'bg-white/50 border-zinc-200';
      case 'emerald': return 'bg-emerald-900/50 border-emerald-800';
      case 'rose': return 'bg-rose-900/50 border-rose-800';
      case 'amber': return 'bg-amber-900/50 border-amber-800';
      case 'blue': return 'bg-blue-900/50 border-blue-800';
      default: return 'bg-zinc-900/50 border-zinc-800';
    }
  };

  const getTextClasses = () => {
    return theme === 'light' ? 'text-zinc-950' : 'text-zinc-100';
  };

  const getMutedTextClasses = () => {
    switch (theme) {
      case 'light': return 'text-zinc-500';
      case 'emerald': return 'text-emerald-400/60';
      case 'rose': return 'text-rose-400/60';
      case 'amber': return 'text-amber-400/60';
      case 'blue': return 'text-blue-400/60';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className={cn("text-3xl font-bold flex items-center gap-3", getTextClasses())}>
          <Shield className={cn("w-8 h-8", getMutedTextClasses())} />
          لوحة تحكم المسؤول
        </h1>
        <p className={getMutedTextClasses()}>تحليلات النظام وإدارة المستخدمين.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} theme={theme} />
        <StatCard title="عمليات الإنشاء" value={stats.totalGens} icon={<Activity className="w-5 h-5" />} theme={theme} />
        <StatCard title="متوسط الدرجة" value={stats.avgScore} icon={<BarChart3 className="w-5 h-5" />} theme={theme} />
        <StatCard title="أفضل مجال" value={stats.topNiche} icon={<TrendingUp className="w-5 h-5" />} theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Management */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={cn("text-xl font-bold", getTextClasses())}>إدارة المستخدمين</h2>
            <div className="relative">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", getMutedTextClasses())} />
              <input
                type="text"
                placeholder="البحث عن المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("pl-10 pr-4 py-2 border rounded-xl outline-none w-64 transition-all", theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-950 focus:ring-zinc-300' : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-zinc-700')}
              />
            </div>
          </div>

          <div className={cn("border rounded-3xl overflow-hidden", getSurfaceClasses())}>
            <table className="w-full text-left">
              <thead>
                <tr className={cn("border-b", theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-900/50')}>
                  <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-wider", getMutedTextClasses())}>المستخدم</th>
                  <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-wider", getMutedTextClasses())}>الدور</th>
                  <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-wider", getMutedTextClasses())}>تاريخ الانضمام</th>
                  <th className={cn("px-6 py-4 text-xs font-bold uppercase tracking-wider text-right", getMutedTextClasses())}>الإجراءات</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", theme === 'light' ? 'divide-zinc-200' : 'divide-zinc-800')}>
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className={cn("transition-colors", theme === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/30')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || ''} alt="" className={cn("w-8 h-8 rounded-full border", theme === 'light' ? 'border-zinc-200' : 'border-zinc-700')} />
                        <div>
                          <div className={cn("text-sm font-medium", getTextClasses())}>{u.displayName}</div>
                          <div className={getMutedTextClasses()}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", u.role === 'admin' ? (theme === 'light' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-950') : (theme === 'light' ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-800 text-zinc-400'))}>
                        {u.role}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 text-sm", getMutedTextClasses())}>
                      {u.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.uid !== user.uid && (
                          <>
                            <button
                              onClick={() => setConfirmingRoleChange({ user: u, newRole: u.role === 'admin' ? 'user' : 'admin' })}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                u.role === 'admin' 
                                  ? (theme === 'light' ? 'hover:bg-zinc-100 text-zinc-400 hover:text-amber-600' : 'hover:bg-zinc-800 text-zinc-600 hover:text-amber-400')
                                  : (theme === 'light' ? 'hover:bg-zinc-100 text-zinc-400 hover:text-emerald-600' : 'hover:bg-zinc-800 text-zinc-600 hover:text-emerald-400')
                              )}
                              title={u.role === 'admin' ? 'تخفيض إلى مستخدم' : 'ترقية إلى مسؤول'}
                            >
                              {u.role === 'admin' ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            </button>
                        <button
                          onClick={() => setDeletingUser(u.uid)}
                          className={cn("p-2 rounded-lg transition-all", theme === 'light' ? 'hover:bg-zinc-100 text-zinc-400 hover:text-red-500' : 'hover:bg-zinc-800 text-zinc-600 hover:text-red-400')}
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className={cn("text-xl font-bold", getTextClasses())}>النشاط الأخير</h2>
          <div className="space-y-4">
            {generations.slice(0, 5).map((g) => (
              <div key={g.id} className={cn("p-4 border rounded-2xl space-y-2", getSurfaceClasses())}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-bold uppercase tracking-widest", getMutedTextClasses())}>{g.niche}</span>
                  <span className={cn("text-xs", getMutedTextClasses())}>{g.createdAt?.toDate().toLocaleTimeString()}</span>
                </div>
                <p className={cn("text-sm line-clamp-1", theme === 'light' ? 'text-zinc-600' : 'text-zinc-300')}>{g.results.postIdeas[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmingRoleChange && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmingRoleChange(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl space-y-6",
                theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", confirmingRoleChange.newRole === 'admin' ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
                    <AlertTriangle className={cn("w-5 h-5", confirmingRoleChange.newRole === 'admin' ? 'text-emerald-500' : 'text-amber-500')} />
                  </div>
                  <h3 className={cn("text-xl font-bold", getTextClasses())}>تغيير دور المستخدم</h3>
                </div>
                <button 
                  onClick={() => setConfirmingRoleChange(null)}
                  className={cn("p-2 rounded-full transition-colors", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className={cn("p-4 rounded-2xl border flex items-center gap-4", theme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-900 border-zinc-800')}>
                  <img src={confirmingRoleChange.user.photoURL || ''} alt="" className="w-12 h-12 rounded-full border border-zinc-800" />
                  <div>
                    <div className={cn("font-bold", getTextClasses())}>{confirmingRoleChange.user.displayName}</div>
                    <div className={cn("text-xs", getMutedTextClasses())}>{confirmingRoleChange.user.email}</div>
                  </div>
                </div>

                <p className={cn("text-sm leading-relaxed", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>
                  هل أنت متأكد أنك تريد {confirmingRoleChange.newRole === 'admin' ? 'ترقية' : 'تخفيض'} هذا المستخدم إلى 
                  <span className={cn("font-bold mx-1", confirmingRoleChange.newRole === 'admin' ? 'text-emerald-500' : 'text-amber-500')}>
                    {confirmingRoleChange.newRole === 'admin' ? 'مسؤول' : 'مستخدم عادي'}
                  </span>؟
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingRoleChange(null)}
                  className={cn("flex-1 py-4 rounded-2xl font-bold transition-all", theme === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800')}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={isUpdating}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                    confirmingRoleChange.newRole === 'admin' 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  )}
                >
                  {isUpdating ? <Activity className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  تأكيد التغيير
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingUser(null)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-sm p-8 rounded-[2.5rem] border shadow-2xl space-y-6",
                theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
              )}
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className={cn("text-xl font-black tracking-tighter", getTextClasses())}>حذف المستخدم</h3>
                <p className={cn("text-sm font-medium", getMutedTextClasses())}>
                  هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لن يؤدي هذا إلى حذف عمليات الإنشاء الخاصة به، ولكن سيفقد المستخدم إمكانية الوصول.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeletingUser(null)}
                  className={cn(
                    "py-3 rounded-2xl font-bold transition-all",
                    theme === 'light' ? 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  )}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon, theme }: any) => (
  <div className={cn("p-6 border rounded-3xl space-y-4", theme === 'light' ? 'bg-white/50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800')}>
    <div className={cn("flex items-center justify-between", theme === 'light' ? 'text-zinc-500' : 'text-zinc-500')}>
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      {icon}
    </div>
    <div className={cn("text-3xl font-black", theme === 'light' ? 'text-zinc-950' : 'text-zinc-100')}>{value}</div>
  </div>
);
