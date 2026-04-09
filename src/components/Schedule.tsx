import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ScheduledPost } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Calendar, Clock, Trash2, CheckCircle2, AlertCircle, Instagram, Twitter, Linkedin, Facebook, Youtube, MessageSquare, Pin, Ghost, Globe } from 'lucide-react';

interface ScheduleProps {
  user: UserProfile;
}

export const Schedule: React.FC<ScheduleProps> = ({ user }) => {
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
      case 'x': return <Twitter className="w-4 h-4 text-zinc-950" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
      case 'threads': return <MessageSquare className="w-4 h-4 text-zinc-950" />;
      case 'pinterest': return <Pin className="w-4 h-4 text-red-500" />;
      case 'snapchat': return <Ghost className="w-4 h-4 text-yellow-400" />;
      default: return <Globe className="w-4 h-4 text-zinc-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-b-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 font-body">
      <header className="space-y-1">
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter">الجدولة</h1>
        <p className="text-on-surface-variant font-medium">إدارة المنشورات المخطط لها للنشر التلقائي عبر منصاتك.</p>
      </header>

      {scheduledPosts.length === 0 ? (
        <div className="p-20 border-2 border-dashed border-outline-variant/20 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-outline-variant opacity-20" />
          </div>
          <p className="text-on-surface-variant font-medium max-w-xs">لا توجد منشورات مجدولة حالياً. ابدأ بإنشاء محتوى وجدولته من لوحة التحكم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {scheduledPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-8 bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] shadow-[0_15px_35px_rgba(0,0,0,0.05)] space-y-6 flex flex-col h-full group hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-surface-container-low rounded-xl text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      {getPlatformIcon(post.platform)}
                    </div>
                    <span className="text-xs font-headline font-bold text-on-surface">{post.platform}</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-label font-bold flex items-center gap-1.5 border",
                    post.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                    post.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                    'bg-red-500/10 text-red-600 border-red-500/20'
                  )}>
                    {post.status === 'pending' ? <Clock className="w-3 h-3" /> : 
                     post.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : 
                     <AlertCircle className="w-3 h-3" />}
                    {post.status === 'pending' ? 'قيد الانتظار' : 
                     post.status === 'published' ? 'تم النشر' : 'فشل النشر'}
                  </div>
                </div>

                <p className="text-sm leading-relaxed flex-1 line-clamp-5 text-on-surface-variant font-medium">
                  {post.content}
                </p>

                <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-label font-bold uppercase tracking-widest text-outline-variant">موعد النشر</span>
                    <span className="text-xs font-headline font-bold text-on-surface">
                      {new Date(post.scheduledAt.toDate()).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })} - {new Date(post.scheduledAt.toDate()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-3 rounded-full hover:bg-red-50 text-outline-variant hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
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
