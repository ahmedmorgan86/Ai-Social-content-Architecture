import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ScheduledPost } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Calendar, Clock, Trash2, CheckCircle2, AlertCircle, Instagram, Twitter, Linkedin, Facebook, Youtube, MessageSquare, Pin, Ghost, Globe } from 'lucide-react';

interface ScheduleProps {
  user: UserProfile;
  theme: string;
}

export const Schedule: React.FC<ScheduleProps> = ({ user, theme }) => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'scheduled_posts'),
      where('userId', '==', user.uid),
      orderBy('scheduledAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduledPost[];
      setScheduledPosts(posts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scheduled_posts');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scheduled_posts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `scheduled_posts/${id}`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'tiktok': return <div className="w-4 h-4 bg-zinc-100 rounded-full flex items-center justify-center"><span className="text-[8px] font-black text-black">T</span></div>;
      case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'x': return <Twitter className="w-4 h-4 text-zinc-100" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
      case 'threads': return <MessageSquare className="w-4 h-4 text-zinc-100" />;
      case 'pinterest': return <Pin className="w-4 h-4 text-red-500" />;
      case 'snapchat': return <Ghost className="w-4 h-4 text-yellow-400" />;
      default: return <Globe className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getTextClasses = () => theme === 'light' ? 'text-zinc-950' : 'text-zinc-100';
  const getMutedTextClasses = () => theme === 'light' ? 'text-zinc-500' : 'text-zinc-500';
  const getSurfaceClasses = () => theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className={cn("text-4xl font-black tracking-tighter", getTextClasses())}>المجدولة</h1>
          <p className={cn("text-sm font-medium", getMutedTextClasses())}>إدارة المنشورات المخطط لها للنشر التلقائي.</p>
        </div>
      </div>

      {scheduledPosts.length === 0 ? (
        <div className={cn("p-12 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4", theme === 'light' ? 'border-zinc-200 text-zinc-400' : 'border-zinc-800 text-zinc-600')}>
          <Calendar className="w-12 h-12 opacity-20" />
          <p className="max-w-xs">لا توجد منشورات مجدولة حالياً. ابدأ بإنشاء محتوى وجدولته من لوحة التحكم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {scheduledPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn("p-6 border rounded-3xl space-y-4 flex flex-col h-full", getSurfaceClasses())}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900')}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <span className={cn("text-xs font-bold", getTextClasses())}>{post.platform}</span>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
                    post.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                    post.status === 'published' ? 'bg-green-500/10 text-green-500' : 
                    'bg-red-500/10 text-red-500'
                  )}>
                    {post.status === 'pending' ? <Clock className="w-3 h-3" /> : 
                     post.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : 
                     <AlertCircle className="w-3 h-3" />}
                    {post.status === 'pending' ? 'قيد الانتظار' : 
                     post.status === 'published' ? 'تم النشر' : 'فشل النشر'}
                  </div>
                </div>

                <p className={cn("text-sm leading-relaxed flex-1 line-clamp-4", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>
                  {post.content}
                </p>

                <div className={cn("pt-4 border-t flex items-center justify-between", theme === 'light' ? 'border-zinc-100' : 'border-zinc-900')}>
                  <div className="flex flex-col">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>موعد النشر</span>
                    <span className={cn("text-xs font-bold", getTextClasses())}>
                      {new Date(post.scheduledAt.toDate()).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })} - {new Date(post.scheduledAt.toDate()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className={cn("p-2 rounded-xl transition-colors text-zinc-500 hover:text-red-500", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-900')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
