import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, where, updateDoc } from 'firebase/firestore';
import { UserProfile, ContentGeneration } from '../types';
import { Users, BarChart3, Trash2, Shield, Search, TrendingUp, Activity, UserPlus, UserMinus, AlertTriangle, X as CloseIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AdminProps {
  user: UserProfile;
}

export const Admin: React.FC<AdminProps> = ({ user }) => {
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

  return (
    <div className="max-w-6xl mx-auto space-y-12 font-body">
      <header className="space-y-1">
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter flex items-center gap-4">
          <Shield className="w-10 h-10 text-primary" />
          لوحة تحكم المسؤول
        </h1>
        <p className="text-on-surface-variant font-medium">تحليلات النظام وإدارة المستخدمين والعمليات.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users className="w-6 h-6" />} />
        <StatCard title="عمليات الإنشاء" value={stats.totalGens} icon={<Activity className="w-6 h-6" />} />
        <StatCard title="متوسط الدرجة" value={stats.avgScore} icon={<BarChart3 className="w-6 h-6" />} />
        <StatCard title="أفضل مجال" value={stats.topNiche} icon={<TrendingUp className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* User Management */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-2xl font-headline font-black text-on-surface tracking-tighter">إدارة المستخدمين</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" />
              <input
                type="text"
                placeholder="البحث عن المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-surface-container-low border border-outline-variant/20 rounded-full text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
                    <th className="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">المستخدم</th>
                    <th className="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">الدور</th>
                    <th className="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">تاريخ الانضمام</th>
                    <th className="px-8 py-5 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="transition-colors hover:bg-surface-container-low/30">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={u.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                          <div>
                            <div className="text-sm font-headline font-bold text-on-surface">{u.displayName}</div>
                            <div className="text-xs text-on-surface-variant font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-widest border",
                          u.role === 'admin' ? "bg-primary/10 text-primary border-primary/20" : "bg-surface-container-low text-on-surface-variant border-outline-variant/10"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant font-medium">
                        {u.createdAt?.toDate().toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-left">
                        <div className="flex items-center justify-start gap-2">
                          {u.uid !== user.uid && (
                            <>
                              <button
                                onClick={() => setConfirmingRoleChange({ user: u, newRole: u.role === 'admin' ? 'user' : 'admin' })}
                                className={cn(
                                  "p-2 rounded-full transition-all",
                                  u.role === 'admin' 
                                    ? "hover:bg-amber-50 text-outline-variant hover:text-amber-600"
                                    : "hover:bg-emerald-50 text-outline-variant hover:text-emerald-600"
                                )}
                                title={u.role === 'admin' ? 'تخفيض إلى مستخدم' : 'ترقية إلى مسؤول'}
                              >
                                {u.role === 'admin' ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setDeletingUser(u.uid)}
                                className="p-2 rounded-full hover:bg-red-50 text-outline-variant hover:text-red-500 transition-all"
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
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-2xl font-headline font-black text-on-surface tracking-tighter">النشاط الأخير</h2>
          <div className="space-y-4">
            {generations.slice(0, 6).map((g) => (
              <div key={g.id} className="p-5 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-label font-bold uppercase tracking-widest text-primary group-hover:text-primary transition-colors">{g.niche}</span>
                  <span className="text-[10px] font-medium text-outline-variant">{g.createdAt?.toDate().toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-on-surface-variant font-medium line-clamp-2 leading-relaxed">{g.results.postIdeas[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmingRoleChange && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
              className="relative w-full max-w-md bg-surface-container-lowest p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", confirmingRoleChange.newRole === 'admin' ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
                    <AlertTriangle className={cn("w-6 h-6", confirmingRoleChange.newRole === 'admin' ? 'text-emerald-500' : 'text-amber-500')} />
                  </div>
                  <h3 className="text-2xl font-headline font-black text-on-surface tracking-tighter">تغيير دور المستخدم</h3>
                </div>
                <button 
                  onClick={() => setConfirmingRoleChange(null)}
                  className="p-2 rounded-full hover:bg-surface-container-low transition-all text-on-surface-variant"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl flex items-center gap-5">
                  <img src={confirmingRoleChange.user.photoURL || ''} alt="" className="w-14 h-14 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <div className="font-headline font-bold text-on-surface">{confirmingRoleChange.user.displayName}</div>
                    <div className="text-xs text-on-surface-variant font-medium">{confirmingRoleChange.user.email}</div>
                  </div>
                </div>

                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                  هل أنت متأكد أنك تريد {confirmingRoleChange.newRole === 'admin' ? 'ترقية' : 'تخفيض'} هذا المستخدم إلى 
                  <span className={cn("font-black mx-1", confirmingRoleChange.newRole === 'admin' ? 'text-emerald-500' : 'text-amber-500')}>
                    {confirmingRoleChange.newRole === 'admin' ? 'مسؤول' : 'مستخدم عادي'}
                  </span>؟
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfirmingRoleChange(null)}
                  className="py-4 rounded-2xl font-label font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={isUpdating}
                  className={cn(
                    "py-4 rounded-2xl font-label font-bold flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95",
                    confirmingRoleChange.newRole === 'admin' 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20" 
                      : "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20"
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
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-lowest p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-headline font-black text-on-surface tracking-tighter">حذف المستخدم</h3>
                <p className="text-on-surface-variant font-medium">
                  هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لن يؤدي هذا إلى حذف عمليات الإنشاء الخاصة به، ولكن سيفقد المستخدم إمكانية الوصول.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="py-4 rounded-2xl font-label font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="py-4 rounded-2xl font-label font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
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

const StatCard = ({ title, value, icon }: any) => (
  <div className="p-8 bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] space-y-6 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between text-on-surface-variant">
      <span className="text-[10px] font-label font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{title}</span>
      <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
        {icon}
      </div>
    </div>
    <div className="text-4xl font-headline font-black text-on-surface tracking-tighter">{value}</div>
  </div>
);
