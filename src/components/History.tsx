import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ContentGeneration, UserProfile } from '../types';
import { Trash2, Calendar, ChevronRight, Search, Clock, Video, TrendingUp, Globe, FileText, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface HistoryProps {
  user: UserProfile;
}

export const History: React.FC<HistoryProps> = ({ user }) => {
  const [generations, setGenerations] = useState<ContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<ContentGeneration | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<{ id: string, e: React.MouseEvent } | null>(null);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'generations');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { id, e } = deletingId;
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'generations', id));
      if (selected?.id === id) setSelected(null);
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `generations/${id}`);
    }
  };

  const filtered = generations.filter(g => 
    g.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.activityType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 font-body">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">السجل</h1>
          <p className="text-on-surface-variant font-medium">استراتيجيات المحتوى والأفكار السابقة الخاصة بك.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant" />
          <input
            type="text"
            placeholder="البحث في المجالات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-surface-container-low border border-outline-variant/20 rounded-full text-on-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-5 space-y-4"
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-2xl animate-pulse bg-surface-container-low border border-outline-variant/10" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((g) => (
              <motion.div
                key={g.id}
                layoutId={g.id}
                variants={itemVariants}
                onClick={() => setSelected(g)}
                className={cn(
                  "p-5 rounded-2xl cursor-pointer transition-all group border relative overflow-hidden",
                  selected?.id === g.id 
                    ? "bg-primary border-primary shadow-lg" 
                    : "bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-low"
                )}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <h3 className={cn(
                      "font-headline font-bold text-lg",
                      selected?.id === g.id ? "text-white" : "text-on-surface"
                    )}>
                      {g.niche}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-label font-bold uppercase tracking-widest">
                      <span className={selected?.id === g.id ? "text-white/80" : "text-primary"}>
                        {g.activityType}
                      </span>
                      <span className={selected?.id === g.id ? "text-white/40" : "text-outline-variant"}>•</span>
                      <span className={cn("flex items-center gap-1", selected?.id === g.id ? "text-white/60" : "text-on-surface-variant")}>
                        <Clock className="w-3 h-3" />
                        {g.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId({ id: g.id, e });
                      }}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        selected?.id === g.id 
                          ? "hover:bg-white/10 text-white/50 hover:text-white" 
                          : "hover:bg-red-50 text-outline-variant hover:text-red-500 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={cn("w-5 h-5 transition-transform", selected?.id === g.id ? "text-white rotate-90" : "text-outline-variant")} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              variants={itemVariants}
              className="p-16 border-2 border-dashed border-outline-variant/20 rounded-3xl text-center space-y-4"
            >
              <Search className="w-12 h-12 mx-auto text-outline-variant opacity-20" />
              <p className="text-on-surface-variant font-medium">لم يتم العثور على سجل.</p>
            </motion.div>
          )}
        </motion.div>

        {/* Detail View */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-10"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/10 pb-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-black text-on-surface tracking-tighter">{selected.niche}</h2>
                    <div className="flex items-center gap-3 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
                      <span>{selected.activityType}</span>
                      {selected.tone && (
                        <>
                          <span className="text-outline-variant">•</span>
                          <span>{selected.tone}</span>
                        </>
                      )}
                      {selected.duration && (
                        <>
                          <span className="text-outline-variant">•</span>
                          <span>{selected.duration} يوم</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-headline font-black text-primary tracking-tighter">{selected.results.score}</div>
                    <div className="text-[10px] font-label font-bold uppercase tracking-widest text-outline-variant">الدرجة</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline font-bold text-lg text-on-surface flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        أفكار المنشورات
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(selected.results.postIdeas.join('\n'), 'posts')}
                        className="p-2 rounded-full hover:bg-surface-container-low transition-all text-on-surface-variant"
                      >
                        {copiedId === 'posts' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {selected.results.postIdeas.map((item, i) => (
                        <li key={i} className="text-sm leading-relaxed text-on-surface-variant flex gap-3">
                          <span className="text-primary font-black">0{i + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline font-bold text-lg text-on-surface flex items-center gap-3">
                        <Video className="w-5 h-5 text-primary" />
                        أفكار الفيديوهات
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(selected.results.videoIdeas.join('\n'), 'videos')}
                        className="p-2 rounded-full hover:bg-surface-container-low transition-all text-on-surface-variant"
                      >
                        {copiedId === 'videos' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {selected.results.videoIdeas.map((item, i) => (
                        <li key={i} className="text-sm leading-relaxed text-on-surface-variant flex gap-3">
                          <span className="text-primary font-black">0{i + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {selected.results.hook && (
                  <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl space-y-3">
                    <h4 className="font-headline font-bold text-sm text-on-surface flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      الخطاف (Hook)
                    </h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">"{selected.results.hook}"</p>
                  </div>
                )}

                {selected.results.calendar && Array.isArray(selected.results.calendar) && (
                  <div className="space-y-6 pt-8 border-t border-outline-variant/10">
                    <h4 className="font-headline font-bold text-lg text-on-surface flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      تقويم المحتوى
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selected.results.calendar.map((day) => (
                        <div key={day.day} className="p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl space-y-2 group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-headline font-black text-outline-variant group-hover:text-primary transition-colors">يوم {day.day}</span>
                            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[8px] font-label font-bold uppercase text-primary">{day.platform}</span>
                          </div>
                          <p className="text-xs font-body font-medium text-on-surface-variant line-clamp-2">{day.topic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-8 border-t border-outline-variant/10">
                  <h4 className="font-headline font-bold text-lg text-on-surface">الوسوم</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.results.hashtags.map((tag, i) => (
                      <span key={i} className="px-4 py-2 bg-surface-container-low border border-outline-variant/10 rounded-full text-xs font-label font-bold text-on-surface-variant hover:bg-white transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-16 border-2 border-dashed border-outline-variant/20 rounded-3xl space-y-4 text-center">
                <Globe className="w-16 h-16 text-outline-variant opacity-10" />
                <p className="text-on-surface-variant font-medium max-w-xs">اختر عملية إنشاء من القائمة الجانبية لعرض تفاصيل الاستراتيجية.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-headline font-black text-on-surface tracking-tighter">حذف السجل</h3>
                <p className="text-on-surface-variant font-medium">
                  هل أنت متأكد أنك تريد حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeletingId(null)}
                  className="py-4 rounded-2xl font-label font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
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
