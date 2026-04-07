import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ContentGeneration, UserProfile } from '../types';
import { Trash2, Calendar, ChevronRight, Search, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryProps {
  user: UserProfile;
}

export const History: React.FC<HistoryProps> = ({ user }) => {
  const [generations, setGenerations] = useState<ContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<ContentGeneration | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'generations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ContentGeneration));
      setGenerations(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'generations', id));
      if (selected?.id === id) setSelected(null);
    } catch (error) {
      console.error('Error deleting generation:', error);
    }
  };

  const filtered = generations.filter(g => 
    g.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.activityType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-zinc-100">السجل</h1>
          <p className="text-zinc-500">استراتيجيات المحتوى والأفكار السابقة الخاصة بك.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="البحث في المجالات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:ring-2 focus:ring-zinc-700 outline-none w-full md:w-64"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((g) => (
              <motion.div
                key={g.id}
                layoutId={g.id}
                onClick={() => setSelected(g)}
                className={g.id === selected?.id ? "p-4 bg-zinc-100 rounded-2xl cursor-pointer group" : "p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 cursor-pointer transition-all group"}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className={g.id === selected?.id ? "font-bold text-zinc-950" : "font-bold text-zinc-100"}>
                      {g.niche}
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={g.id === selected?.id ? "text-zinc-600 uppercase font-semibold" : "text-zinc-500 uppercase font-semibold"}>
                        {g.activityType}
                      </span>
                      <span className={g.id === selected?.id ? "text-zinc-400" : "text-zinc-600"}>•</span>
                      <span className={g.id === selected?.id ? "text-zinc-500 flex items-center gap-1" : "text-zinc-600 flex items-center gap-1"}>
                        <Clock className="w-3 h-3" />
                        {g.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(g.id, e)}
                      className={g.id === selected?.id ? "p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-red-500" : "p-2 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={g.id === selected?.id ? "w-5 h-5 text-zinc-400" : "w-5 h-5 text-zinc-700"} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 text-center">
              لم يتم العثور على سجل.
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-8"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-100">{selected.niche}</h2>
                    <p className="text-zinc-500 uppercase text-xs font-bold tracking-widest">{selected.activityType}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-zinc-100">{selected.results.score}</div>
                    <div className="text-xs text-zinc-600 font-bold uppercase tracking-tighter">الدرجة</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-zinc-100 font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      أفكار المنشورات
                    </h4>
                    <ul className="space-y-2">
                      {selected.results.postIdeas.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-zinc-100 font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      أفكار الفيديوهات
                    </h4>
                    <ul className="space-y-2">
                      {selected.results.videoIdeas.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4 border-t border-zinc-800 pt-6">
                  <h4 className="text-zinc-100 font-bold">الوسوم</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.results.hashtags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-xs text-zinc-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl text-zinc-700">
                <ChevronRight className="w-12 h-12 opacity-10 rotate-180" />
                <p className="mt-4">اختر عملية إنشاء لعرض التفاصيل.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
