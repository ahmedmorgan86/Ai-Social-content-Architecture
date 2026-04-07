import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, where } from 'firebase/firestore';
import { UserProfile, ContentGeneration } from '../types';
import { Users, BarChart3, Trash2, Shield, Search, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [generations, setGenerations] = useState<ContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
    });

    const unsubGens = onSnapshot(collection(db, 'generations'), (snapshot) => {
      setGenerations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ContentGeneration)));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubGens();
    };
  }, []);

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لن يؤدي هذا إلى حذف عمليات الإنشاء الخاصة به.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error('Error deleting user:', error);
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
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <Shield className="w-8 h-8 text-zinc-500" />
          لوحة تحكم المسؤول
        </h1>
        <p className="text-zinc-500">تحليلات النظام وإدارة المستخدمين.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} />
        <StatCard title="عمليات الإنشاء" value={stats.totalGens} icon={<Activity className="w-5 h-5" />} />
        <StatCard title="متوسط الدرجة" value={stats.avgScore} icon={<BarChart3 className="w-5 h-5" />} />
        <StatCard title="أفضل مجال" value={stats.topNiche} icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Management */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100">إدارة المستخدمين</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="البحث عن المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:ring-2 focus:ring-zinc-700 outline-none w-64"
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">المستخدم</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">الدور</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">تاريخ الانضمام</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-zinc-700" />
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{u.displayName}</div>
                          <div className="text-xs text-zinc-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {u.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.uid)}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xl font-bold text-zinc-100">النشاط الأخير</h2>
          <div className="space-y-4">
            {generations.slice(0, 5).map((g) => (
              <div key={g.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{g.niche}</span>
                  <span className="text-xs text-zinc-600">{g.createdAt?.toDate().toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-zinc-300 line-clamp-1">{g.results.postIdeas[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: any) => (
  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
    <div className="flex items-center justify-between text-zinc-500">
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      {icon}
    </div>
    <div className="text-3xl font-black text-zinc-100">{value}</div>
  </div>
);
