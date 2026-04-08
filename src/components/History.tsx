import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ContentGeneration, UserProfile } from '../types';
import { Trash2, Calendar, ChevronRight, Search, Clock, Video, TrendingUp, Globe, FileText, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface HistoryProps {
  user: UserProfile;
  theme: string;
}

export const History: React.FC<HistoryProps> = ({ user, theme }) => {
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className={cn("text-3xl font-bold", getTextClasses())}>السجل</h1>
          <p className={getMutedTextClasses()}>استراتيجيات المحتوى والأفكار السابقة الخاصة بك.</p>
        </div>
        <div className="relative">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", getMutedTextClasses())} />
          <input
            type="text"
            placeholder="البحث في المجالات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("pl-10 pr-4 py-2 border rounded-xl outline-none w-full md:w-64 transition-all", theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-950 focus:ring-zinc-300' : 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-zinc-700')}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-5 space-y-4"
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={cn("h-24 rounded-2xl animate-pulse", theme === 'light' ? 'bg-zinc-200' : 'bg-zinc-900/50')} />
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
                  "p-4 rounded-2xl cursor-pointer transition-all group border",
                  selected?.id === g.id 
                    ? (theme === 'light' ? "bg-zinc-950 border-zinc-950" : "bg-zinc-100 border-zinc-100") 
                    : (theme === 'light' ? "bg-white border-zinc-200 hover:border-zinc-300" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700")
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className={cn("font-bold", selected?.id === g.id ? (theme === 'light' ? "text-zinc-100" : "text-zinc-950") : getTextClasses())}>
                      {g.niche}
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={cn("uppercase font-semibold", selected?.id === g.id ? (theme === 'light' ? "text-zinc-400" : "text-zinc-600") : getMutedTextClasses())}>
                        {g.activityType}
                      </span>
                      <span className={cn(selected?.id === g.id ? (theme === 'light' ? "text-zinc-700" : "text-zinc-300") : "text-zinc-700")}>•</span>
                      <span className={cn("flex items-center gap-1", selected?.id === g.id ? (theme === 'light' ? "text-zinc-500" : "text-zinc-500") : getMutedTextClasses())}>
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
                        "p-2 rounded-lg transition-all",
                        selected?.id === g.id 
                          ? (theme === 'light' ? "hover:bg-zinc-900 text-zinc-500 hover:text-red-400" : "hover:bg-zinc-200 text-zinc-500 hover:text-red-500") 
                          : "hover:bg-zinc-800 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={cn("w-5 h-5", selected?.id === g.id ? (theme === 'light' ? "text-zinc-700" : "text-zinc-400") : "text-zinc-700")} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              variants={itemVariants}
              className={cn("p-12 border-2 border-dashed rounded-3xl text-center", theme === 'light' ? 'border-zinc-200 text-zinc-400' : 'border-zinc-800 text-zinc-600')}
            >
              لم يتم العثور على سجل.
            </motion.div>
          )}
        </motion.div>

        {/* Detail View */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn("p-8 border rounded-3xl space-y-8", getSurfaceClasses())}
              >
                <div className={cn("flex items-center justify-between border-b pb-6", theme === 'light' ? 'border-zinc-200' : 'border-zinc-800')}>
                  <div className="space-y-1">
                    <h2 className={cn("text-2xl font-bold", getTextClasses())}>{selected.niche}</h2>
                    <div className="flex items-center gap-3">
                      <p className={cn("uppercase text-xs font-bold tracking-widest", getMutedTextClasses())}>{selected.activityType}</p>
                      {selected.tone && (
                        <>
                          <span className={cn(theme === 'light' ? "text-zinc-300" : "text-zinc-700")}>•</span>
                          <p className={cn("text-xs font-bold", getMutedTextClasses())}>{selected.tone}</p>
                        </>
                      )}
                      {selected.duration && (
                        <>
                          <span className={cn(theme === 'light' ? "text-zinc-300" : "text-zinc-700")}>•</span>
                          <p className={cn("text-xs font-bold", getMutedTextClasses())}>{selected.duration} يوم</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-3xl font-black", getTextClasses())}>{selected.results.score}</div>
                    <div className={cn("text-xs font-bold uppercase tracking-tighter", getMutedTextClasses())}>الدرجة</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("font-bold flex items-center gap-2", getTextClasses())}>
                        <FileText className={cn("w-4 h-4", getMutedTextClasses())} />
                        أفكار المنشورات
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(selected.results.postIdeas.join('\n'), 'posts')}
                        className={cn("p-1.5 rounded-md transition-colors", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
                      >
                        {copiedId === 'posts' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className={cn("w-3.5 h-3.5", getMutedTextClasses())} />}
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {selected.results.postIdeas.map((item, i) => (
                        <li key={i} className={cn("text-sm leading-relaxed", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("font-bold flex items-center gap-2", getTextClasses())}>
                        <Video className={cn("w-4 h-4", getMutedTextClasses())} />
                        أفكار الفيديوهات
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(selected.results.videoIdeas.join('\n'), 'videos')}
                        className={cn("p-1.5 rounded-md transition-colors", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
                      >
                        {copiedId === 'videos' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className={cn("w-3.5 h-3.5", getMutedTextClasses())} />}
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {selected.results.videoIdeas.map((item, i) => (
                        <li key={i} className={cn("text-sm leading-relaxed", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {selected.results.hook && (
                  <div className={cn("p-4 border rounded-2xl space-y-2", theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800')}>
                    <h4 className={cn("font-bold text-sm flex items-center gap-2", getTextClasses())}>
                      <TrendingUp className={cn("w-4 h-4", getMutedTextClasses())} />
                      الخطاف
                    </h4>
                    <p className={cn("text-sm italic", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>"{selected.results.hook}"</p>
                  </div>
                )}

                {selected.results.calendar && Array.isArray(selected.results.calendar) && (
                  <div className={cn("space-y-4 border-t pt-6", theme === 'light' ? 'border-zinc-200' : 'border-zinc-800')}>
                    <h4 className={cn("font-bold flex items-center gap-2", getTextClasses())}>
                      <Calendar className={cn("w-4 h-4", getMutedTextClasses())} />
                      تقويم المحتوى
                    </h4>
                    <div className={cn(
                      "grid gap-3",
                      selected.results.calendar.length > 7 
                        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" 
                        : "grid-cols-1 sm:grid-cols-2"
                    )}>
                      {selected.results.calendar.map((day) => (
                        <div key={day.day} className={cn("p-3 border rounded-xl space-y-1", theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800')}>
                          <div className="flex items-center justify-between">
                            <span className={cn("text-[10px] font-black", theme === 'light' ? 'text-zinc-300' : 'text-zinc-700')}>يوم {day.day}</span>
                            <span className={cn("text-[8px] font-bold uppercase", theme === 'light' ? 'bg-zinc-100 text-zinc-500' : 'text-zinc-500')}>{day.platform}</span>
                          </div>
                          <p className={cn("text-xs font-medium", theme === 'light' ? 'text-zinc-700' : 'text-zinc-400')}>{day.topic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={cn("space-y-4 border-t pt-6", theme === 'light' ? 'border-zinc-200' : 'border-zinc-800')}>
                  <h4 className={cn("font-bold", getTextClasses())}>الوسوم</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.results.hashtags.map((tag, i) => (
                      <span key={i} className={cn("px-3 py-1 border rounded-full text-xs", theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600' : 'bg-zinc-950 border-zinc-800 text-zinc-500')}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className={cn("h-full flex flex-col items-center justify-center p-12 border rounded-3xl", theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-400' : 'bg-zinc-900/20 border-zinc-800/50 text-zinc-700')}>
                <ChevronRight className="w-12 h-12 opacity-10 rotate-180" />
                <p className="mt-4">اختر عملية إنشاء لعرض التفاصيل.</p>
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
                <h3 className={cn("text-xl font-black tracking-tighter", getTextClasses())}>حذف السجل</h3>
                <p className={cn("text-sm font-medium", getMutedTextClasses())}>
                  هل أنت متأكد أنك تريد حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className={cn(
                    "py-3 rounded-2xl font-bold transition-all",
                    theme === 'light' ? 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  )}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
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
