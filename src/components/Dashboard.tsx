import React, { useState } from 'react';
import { generateSocialContent, refineContent } from '../services/geminiService';
import { ContentResults, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Zap, Send, Loader2, Copy, Check, TrendingUp, Calendar, Video, FileText, Hash, Star, Info, Heart, Share2, Download, Layout, Smartphone, Globe, RefreshCcw, Wand2, Instagram, Twitter, Linkedin, Facebook, Youtube, MessageSquare, Pin, Ghost, Shield, ChevronDown, X as CloseIcon, Clock, Split, BarChart2, ThumbsUp, MessageCircle, Trash2, Trophy, Crown, Target, Lightbulb, Sparkles, MoreHorizontal, Bookmark, Edit3, ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { GoogleAd } from './GoogleAd';
import { SocialPreview } from './SocialPreview';

interface DashboardProps {
  user: UserProfile;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const DASHBOARD_TABS = [
  { id: 'strategy', label: 'الاستراتيجية', icon: 'auto_awesome' },
  { id: 'ideas', label: 'الأفكار', icon: 'lightbulb' },
  { id: 'content', label: 'المحتوى', icon: 'movie' },
  { id: 'calendar', label: 'الجدول الزمني', icon: 'calendar_month' },
  { id: 'abtest', label: 'اختبار A/B', icon: 'analytics' },
];

const PLATFORM_OPTIONS = [
  { id: 'Instagram', icon: <Instagram className="w-3.5 h-3.5" /> },
  { id: 'TikTok', icon: <div className="w-3.5 h-3.5 bg-current rounded-full flex items-center justify-center"><span className="text-[6px] font-black text-zinc-950">T</span></div> },
  { id: 'LinkedIn', icon: <Linkedin className="w-3.5 h-3.5" /> },
  { id: 'X', icon: <Twitter className="w-3.5 h-3.5" /> },
  { id: 'Facebook', icon: <Facebook className="w-3.5 h-3.5" /> },
  { id: 'YouTube', icon: <Youtube className="w-3.5 h-3.5" /> },
  { id: 'Threads', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'Pinterest', icon: <Pin className="w-3.5 h-3.5" /> },
  { id: 'Snapchat', icon: <Ghost className="w-3.5 h-3.5" /> },
];

const TONE_OPTIONS = [
  { id: 'professional', label: 'احترافي', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'casual', label: 'عفوي', icon: <Heart className="w-3.5 h-3.5" /> },
  { id: 'humorous', label: 'فكاهي', icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'bold', label: 'جريء', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'educational', label: 'تعليمي', icon: <Info className="w-3.5 h-3.5" /> },
];

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [niche, setNiche] = useState(user.preferences.niche || '');
  const [activityType, setActivityType] = useState('marketing');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('professional');
  const [platforms, setPlatforms] = useState<string[]>(['Instagram', 'TikTok']);
  const [duration, setDuration] = useState(7);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ContentResults | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState(0);
  const [activeTab, setActiveTab] = useState('strategy');
  const [previewPlatform, setPreviewPlatform] = useState('Instagram');
  const [refineText, setRefineText] = useState('');
  const [refining, setRefining] = useState(false);
  const [selectedPreviewPlatform, setSelectedPreviewPlatform] = useState('Instagram');
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState(0);
  const [schedulingPost, setSchedulingPost] = useState<{ content: string; platform: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [abTests, setAbTests] = useState<any[]>([]);
  const [selectingForAB, setSelectingForAB] = useState<string | null>(null);
  const [abVariationA, setAbVariationA] = useState<string | null>(null);

  React.useEffect(() => {
    const q = query(
      collection(db, 'ab_tests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const path = 'ab_tests';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAbTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleOpenScheduleModal = (content: string, platform: string) => {
    setSchedulingPost({ content, platform });
    setScheduledSuccess(false);
  };

  const handleSelectForAB = (content: string) => {
    if (!abVariationA) {
      setAbVariationA(content);
      setActiveTab('abtest');
    } else {
      handleCreateABTest(content);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche) return;

    setLoading(true);
    try {
      const selectedToneLabel = TONE_OPTIONS.find(t => t.id === tone)?.label || 'احترافي';
      const data = await generateSocialContent(niche, activityType, targetAudience, platforms, selectedToneLabel, duration);
      setResults(data);

      await addDoc(collection(db, 'generations'), {
        userId: user.uid,
        niche,
        activityType,
        targetAudience,
        tone: selectedToneLabel,
        duration,
        platforms,
        results: data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'generations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!results || !refineText) return;
    setRefining(true);
    try {
      const data = await refineContent(results, refineText);
      setResults(data);
      setRefineText('');
    } catch (error) {
      console.error('Error refining content:', error);
    } finally {
      setRefining(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportStrategy = () => {
    if (!results) return;
    const text = `
استراتيجية المحتوى لـ ${niche}
الهدف: ${activityType}
الجمهور: ${targetAudience || 'عام'}
المنصات: ${platforms.join(', ')}

أفكار المنشورات:
${results.postIdeas.join('\n')}

أفكار الفيديوهات:
${results.videoIdeas.join('\n')}

التعليقات:
${results.captions.join('\n')}

الوسوم:
${results.hashtags.join(' ')}

الخطاف:
${results.hook}

السيناريو:
${results.script}
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-${niche}.txt`;
    a.click();
  };

  const togglePlatform = (p: string) => {
    setPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSaveFavorite = async (content: string, type: 'post' | 'video' | 'caption', id: string) => {
    setSaving(id);
    try {
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        type,
        content,
        niche: niche || 'General',
        createdAt: serverTimestamp(),
      });
      setTimeout(() => setSaving(null), 2000);
    } catch (error) {
      console.error('Error saving favorite:', error);
      setSaving(null);
    }
  };

  const handleSchedule = async () => {
    if (!schedulingPost || !scheduleDate || !scheduleTime) return;
    setIsScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      await addDoc(collection(db, 'scheduled_posts'), {
        userId: user.uid,
        content: schedulingPost.content,
        platform: schedulingPost.platform,
        scheduledAt,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setScheduledSuccess(true);
      setTimeout(() => {
        setSchedulingPost(null);
        setScheduledSuccess(false);
        setScheduleDate('');
        setScheduleTime('');
      }, 2000);
    } catch (error) {
      console.error('Error scheduling post:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCreateABTest = async (variationB: string) => {
    if (!abVariationA) return;
    try {
      await addDoc(collection(db, 'ab_tests'), {
        userId: user.uid,
        niche: niche || 'General',
        variationA: { content: abVariationA, likes: 0, comments: 0, shares: 0 },
        variationB: { content: variationB, likes: 0, comments: 0, shares: 0 },
        status: 'active',
        createdAt: serverTimestamp(),
      });
      setAbVariationA(null);
      setSelectingForAB(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ab_tests');
    }
  };

  const handleUpdateABMetric = async (testId: string, variation: 'A' | 'B', metric: 'likes' | 'comments' | 'shares') => {
    const test = abTests.find(t => t.id === testId);
    if (!test || test.status !== 'active') return;
    const field = variation === 'A' ? 'variationA' : 'variationB';
    try {
      await updateDoc(doc(db, 'ab_tests', testId), {
        [`${field}.${metric}`]: test[field][metric] + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ab_tests/${testId}`);
    }
  };

  const handleCloseABTest = async (testId: string) => {
    try {
      await updateDoc(doc(db, 'ab_tests', testId), {
        status: 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ab_tests/${testId}`);
    }
  };

  const handleDeleteABTest = async (testId: string) => {
    try {
      await deleteDoc(doc(db, 'ab_tests', testId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ab_tests/${testId}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getSurfaceClasses = () => {
    return 'bg-surface-container-lowest border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)]';
  };

  const getInputClasses = () => {
    return 'bg-surface-container-low border border-outline-variant/10 text-on-surface focus:ring-primary/20 focus:border-primary/30';
  };

  const getButtonClasses = (active: boolean) => {
    if (active) {
      return 'bg-primary text-white shadow-lg shadow-primary/20';
    }
    return 'bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:border-primary/30';
  };

  const getTextClasses = () => {
    return 'text-on-surface';
  };

  const getMutedTextClasses = () => {
    return 'text-on-surface-variant';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-on-surface uppercase">
              محتوى <span className="italic font-medium text-primary">AI</span>
            </h1>
          </div>
          <p className="text-on-surface-variant font-body text-lg max-w-2xl leading-relaxed">
            المنصة العالمية الرائدة للذكاء الاستراتيجي وصناعة المحتوى. ابدأ ببناء إمبراطوريتك الرقمية اليوم.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/10">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-label text-xs font-bold uppercase tracking-widest",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-8">
          <form onSubmit={handleGenerate} className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -ml-16 -mt-16"></div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-label font-black uppercase tracking-[0.2em] text-outline-variant">المجال الاستراتيجي</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="مثال: لياقة بدنية، تقنية، طعام"
                    className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-body text-sm placeholder:text-outline-variant/50"
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/30 group-focus-within:text-primary/40 transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-label font-black uppercase tracking-[0.2em] text-outline-variant">نوع النشاط</label>
                <div className="relative">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-body text-sm appearance-none cursor-pointer"
                  >
                    <option value="marketing">تسويق استراتيجي</option>
                    <option value="education">تعليم وتطوير</option>
                    <option value="entertainment">ترفيه وتفاعل</option>
                    <option value="personal-brand">علامة تجارية شخصية</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-label font-black uppercase tracking-[0.2em] text-outline-variant">نبرة الصوت (Tone)</label>
                <div className="grid grid-cols-2 gap-3">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-[10px] font-label font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                        tone === t.id
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-surface-container-low border-outline-variant/10 text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      <span className="shrink-0">{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-label font-black uppercase tracking-[0.2em] text-outline-variant">المنصات المستهدفة</label>
                <div 
                  className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 px-6 py-4 outline-none cursor-pointer flex flex-wrap gap-2 items-center min-h-[60px] group hover:border-primary/30 transition-all"
                  onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                >
                  {platforms.length === 0 ? (
                    <span className="text-outline-variant/50 text-sm">اختر المنصات...</span>
                  ) : (
                    platforms.map(p => (
                      <span 
                        key={p} 
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high text-[10px] font-label font-bold uppercase tracking-widest flex items-center gap-2 border border-outline-variant/10"
                      >
                        {PLATFORM_OPTIONS.find(opt => opt.id === p)?.icon}
                        {p}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlatform(p);
                          }}
                          className="hover:text-red-500 transition-colors"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                  <ChevronDown className={cn("w-4 h-4 mr-auto text-outline-variant transition-transform", isPlatformDropdownOpen && "rotate-180")} />
                </div>

                <AnimatePresence>
                  {isPlatformDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-surface shadow-2xl rounded-2xl border border-outline-variant/10 overflow-hidden max-h-64 overflow-y-auto p-2"
                    >
                      {PLATFORM_OPTIONS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-between group",
                            platforms.includes(p.id) 
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-surface-container-low text-on-surface-variant"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-surface-container-high group-hover:bg-white transition-colors">{p.icon}</span>
                            {p.id}
                          </div>
                          {platforms.includes(p.id) && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !niche}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-2xl bg-primary text-white font-label font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden shadow-xl shadow-primary/20 group"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري التحليل...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>إنشاء الاستراتيجية</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={loading ? { translateX: ['-100%', '200%'] } : {}}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.button>
          </form>

          {/* Trending Section */}
          <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/5 space-y-5">
            <div className="flex items-center gap-3 text-outline-variant">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-label font-black uppercase tracking-widest">المجالات الرائجة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['أدوات الذكاء الاصطناعي', 'حياة مستدامة', 'العمل عن بعد', 'التأمل'].map((t) => (
                <button
                  key={t}
                  onClick={() => setNiche(t)}
                  className="px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10 text-xs font-bold text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <GoogleAd slot="1234567890" className="rounded-[2.5rem] overflow-hidden" />
        </div>

        {/* Results Section */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!results ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full min-h-[600px] rounded-[3rem] border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center p-12 space-y-6"
              >
                <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full animate-pulse"></div>
                  <Wand2 className="w-10 h-10 text-outline-variant/40" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tighter">جاهز للبدء؟</h3>
                  <p className="text-on-surface-variant font-body max-w-sm">أدخل مجالك ونوع نشاطك لنقوم بإنشاء استراتيجية محتوى متكاملة مدعومة بالذكاء الاصطناعي.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-10"
              >
                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'strategy' && (
                    <motion.div
                      key="strategy"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Featured Strategy Card */}
                        <div className="md:col-span-8 group relative overflow-hidden rounded-[3rem] bg-surface-container-lowest shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-outline-variant/5">
                          <div className="aspect-[16/9] overflow-hidden bg-primary/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                            <Sparkles className="w-32 h-32 text-primary/10 animate-pulse relative z-10" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-10">
                            <div className="flex items-center gap-4 mb-6">
                              <span className="bg-primary text-white px-5 py-2 rounded-full text-[10px] font-label font-black uppercase tracking-widest shadow-lg shadow-primary/30">محتوى AI v2.0</span>
                              <div className="flex items-center gap-2 text-white/80">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-label font-bold">Viral Score: {results.score}%</span>
                              </div>
                            </div>
                            <h2 className="font-headline font-black text-4xl text-white mb-4 leading-tight tracking-tighter">الخطاف الاستراتيجي: <span className="text-primary italic">{results.hook}</span></h2>
                            <p className="text-white/60 font-body text-lg max-w-xl leading-relaxed">تم تحليل بيانات السوق والمنافسين لإنشاء هذه الاستراتيجية المخصصة لمجال {niche}.</p>
                          </div>
                        </div>

                        {/* Side Info Card */}
                        <div className="md:col-span-4 group relative overflow-hidden rounded-[3rem] bg-surface-container-lowest shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-10 flex flex-col justify-between border border-outline-variant/5">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <Target className="w-5 h-5 text-secondary" />
                              </div>
                              <span className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant">Target Insight</span>
                            </div>
                            <h3 className="font-headline font-black text-2xl text-on-surface tracking-tighter">الجمهور المستهدف</h3>
                            <p className="text-on-surface-variant text-sm font-body leading-relaxed">{targetAudience || 'جمهور عام مهتم بالمحتوى الرقمي والتطور التقني.'}</p>
                          </div>
                          
                          <div className="pt-10 border-t border-outline-variant/10">
                            <button 
                              onClick={exportStrategy}
                              className="w-full bg-on-surface text-surface px-8 py-4 rounded-2xl font-label font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                            >
                              <Download className="w-4 h-4" />
                              تصدير الاستراتيجية
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Refine Section */}
                      <div className="p-10 rounded-[3rem] bg-surface-container-low border border-outline-variant/5 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="p-3 rounded-2xl bg-amber-400/10 text-amber-500">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-headline font-black text-on-surface uppercase tracking-tighter">تحسين الاستراتيجية</h3>
                            <p className="text-on-surface-variant text-xs font-body">اطلب تعديلات محددة من الذكاء الاصطناعي.</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                          <textarea
                            value={refineText}
                            onChange={(e) => setRefineText(e.target.value)}
                            placeholder="مثال: ركز أكثر على تيك توك، أو اجعل الأسلوب أكثر مرحاً..."
                            rows={2}
                            className="flex-1 px-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-sm font-body transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none placeholder:text-outline-variant/50"
                          />
                          <motion.button
                            onClick={handleRefine}
                            disabled={refining || !refineText}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 rounded-2xl bg-primary text-white font-label font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                          >
                            {refining ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                            <span>تعديل</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Advanced Features */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                              <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tighter">الخُطّاف (Hook)</h3>
                          </div>
                          <p className="text-lg font-body font-medium leading-relaxed text-on-surface-variant italic">
                            "{results.hook}"
                          </p>
                          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-outline-variant">أول 3 ثوانٍ في الفيديو</p>
                        </div>
                        
                        <div className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                              <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tighter">أوقات النشر</h3>
                          </div>
                          <div className="space-y-4">
                            {results.bestTimes?.map((bt, i) => (
                              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5">
                                <span className="text-sm font-headline font-black text-on-surface">{bt.platform}</span>
                                <span className="text-sm font-body font-bold text-primary">{bt.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                              <Video className="w-6 h-6" />
                            </div>
                            <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tighter">سيناريو الفيديو</h3>
                          </div>
                          <div className="relative group">
                            <pre className="text-sm whitespace-pre-wrap font-body leading-relaxed text-on-surface-variant max-h-[200px] overflow-y-auto no-scrollbar">
                              {results.script}
                            </pre>
                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-surface-container-lowest to-transparent pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'ideas' && (
                    <motion.div
                      key="ideas"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-12"
                    >
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Lightbulb className="w-6 h-6" />
                          </div>
                          <h3 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tighter">أفكار المنشورات</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                          <ResultCard 
                            title="أفكار المنشورات" 
                            type="post" 
                            icon={<FileText className="w-6 h-6" />} 
                            items={results.postIdeas}
                            onCopy={(text: string) => copyToClipboard(text, 'post-ideas')}
                            onSave={(content: string, id: string) => handleSaveFavorite(content, 'post', id)}
                            onSchedule={(content: string) => handleOpenScheduleModal(content, 'post')}
                            onABTest={handleSelectForAB}
                            isCopied={copied === 'post-ideas'}
                            savingId={saving}
                            selectingForAB={selectingForAB}
                            abVariationA={abVariationA}
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-8">
                          <ResultCard 
                            title="أفكار الفيديوهات القصيرة" 
                            type="video" 
                            icon={<Video className="w-6 h-6" />} 
                            items={results.videoIdeas}
                            onCopy={(text: string) => copyToClipboard(text, 'video-ideas')}
                            onSave={(content: string, id: string) => handleSaveFavorite(content, 'video', id)}
                            onSchedule={(content: string) => handleOpenScheduleModal(content, 'video')}
                            onABTest={handleSelectForAB}
                            isCopied={copied === 'video-ideas'}
                            savingId={saving}
                            selectingForAB={selectingForAB}
                            abVariationA={abVariationA}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'content' && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-10"
                    >
                      <div className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                              <Share2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tighter">معاينة المحتوى</h3>
                          </div>
                          <div className="flex gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/10">
                            {PLATFORM_OPTIONS.map(p => (
                              <button
                                key={p.id}
                                onClick={() => setSelectedPreviewPlatform(p.id)}
                                className={cn(
                                  "p-2.5 rounded-xl transition-all",
                                  selectedPreviewPlatform === p.id 
                                    ? "bg-surface-container-lowest text-primary shadow-sm" 
                                    : "text-on-surface-variant hover:bg-surface-container-lowest/50"
                                )}
                              >
                                {p.icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                          {/* Social Preview Mockup */}
                          <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10 shadow-inner">
                            <SocialPreview 
                              displayName={user.displayName}
                              photoURL={user.photoURL}
                              caption={results.captions[selectedCaptionIndex]}
                              hashtags={results.hashtags}
                              niche={niche}
                              platform={selectedPreviewPlatform}
                              hook={results.hook}
                              onSave={() => handleSaveFavorite(results.captions[selectedCaptionIndex], 'caption', `preview-${selectedCaptionIndex}`)}
                              onSchedule={() => handleOpenScheduleModal(results.captions[selectedCaptionIndex], selectedPreviewPlatform)}
                            />
                          </div>

                          {/* Caption Selector */}
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <label className="text-[10px] font-label font-black uppercase tracking-[0.2em] text-outline-variant">اختر التعليق (Caption)</label>
                              <div className="flex gap-3">
                                {results.captions.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedCaptionIndex(idx)}
                                    className={cn(
                                      "w-12 h-12 rounded-xl font-label font-black text-xs transition-all border",
                                      selectedCaptionIndex === idx
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-surface-container-low border-outline-variant/10 text-on-surface-variant hover:border-primary/30"
                                    )}
                                  >
                                    {idx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/10 space-y-6">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant">التعليق المختار</span>
                                <div className="flex gap-2">
                                  <button className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/10">
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/10">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="font-body text-on-surface leading-relaxed">
                                {results.captions[selectedCaptionIndex]}
                              </p>
                              <div className="pt-6 border-t border-outline-variant/10">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-4">الوسوم (Hashtags)</div>
                                <div className="text-sm font-body text-primary font-bold">
                                  {results.hashtags.join(' ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <button className="flex-1 py-4 rounded-2xl bg-primary text-white font-label font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95">
                                حفظ في المسودات
                              </button>
                              <button 
                                onClick={() => handleOpenScheduleModal(results.captions[selectedCaptionIndex], 'post')}
                                className="flex-1 py-4 rounded-2xl bg-on-surface text-surface font-label font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95"
                              >
                                جدولة النشر
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'calendar' && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-10"
                    >
                      <div className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between mb-10">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                              <CalendarIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tighter">تقويم المحتوى</h3>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant border border-outline-variant/10"><ChevronRight className="w-5 h-5" /></button>
                            <button className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant border border-outline-variant/10"><ChevronLeft className="w-5 h-5" /></button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-4">
                          {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                            <div key={day} className="text-center py-4 text-[10px] font-label font-black uppercase tracking-widest text-outline-variant">
                              {day}
                            </div>
                          ))}
                          {Array.from({ length: 35 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "aspect-square rounded-2xl border border-outline-variant/10 p-3 transition-all hover:border-primary/30 group cursor-pointer",
                                i % 7 === 0 || i % 7 === 6 ? "bg-surface-container-low/50" : "bg-surface-container-low"
                              )}
                            >
                              <span className="text-[10px] font-label font-bold text-outline-variant group-hover:text-primary">{i + 1}</span>
                              {i === 12 && (
                                <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary truncate">
                                  فيديو استراتيجي
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'abtest' && (
                    <motion.div
                      key="abtest"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-10"
                    >
                      <div className="p-10 rounded-[3rem] bg-surface-container-lowest border border-outline-variant/5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-12">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                            <Split className="w-6 h-6" />
                          </div>
                          <h3 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tighter">اختبار A/B الذكي</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* Version A */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <span className="px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-label font-black uppercase tracking-widest">Version A (Control)</span>
                              <div className="flex items-center gap-2 text-green-500">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-bold">4.2% CTR</span>
                              </div>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/10 space-y-6">
                              <h4 className="font-headline font-black text-xl text-on-surface tracking-tighter">العنوان: {results.hook}</h4>
                              <p className="text-sm font-body text-on-surface-variant leading-relaxed">
                                {results.captions[0]?.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 text-center">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-1">Reach</div>
                                <div className="text-lg font-headline font-black text-on-surface">12.4K</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 text-center">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-1">Clicks</div>
                                <div className="text-lg font-headline font-black text-on-surface">521</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 text-center">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-1">Conv.</div>
                                <div className="text-lg font-headline font-black text-on-surface">1.8%</div>
                              </div>
                            </div>
                          </div>

                          {/* Version B */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <span className="px-4 py-1.5 rounded-full bg-secondary text-white text-[10px] font-label font-black uppercase tracking-widest">Version B (Variant)</span>
                              <div className="flex items-center gap-2 text-primary">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-bold">5.8% CTR</span>
                              </div>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/10 space-y-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 bg-amber-400 text-white rounded-bl-2xl">
                                <Trophy className="w-4 h-4" />
                              </div>
                              <h4 className="font-headline font-black text-xl text-on-surface tracking-tighter">العنوان: {results.hook} (معدل)</h4>
                              <p className="text-sm font-body text-on-surface-variant leading-relaxed">
                                {results.captions[1]?.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 text-center">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-1">Reach</div>
                                <div className="text-lg font-headline font-black text-on-surface">11.8K</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 text-center">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-1">Clicks</div>
                                <div className="text-lg font-headline font-black text-on-surface">684</div>
                              </div>
                              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5 text-center">
                                <div className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant mb-1">Conv.</div>
                                <div className="text-lg font-headline font-black text-on-surface">2.4%</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="space-y-2">
                            <h4 className="font-headline font-black text-xl text-primary uppercase tracking-tighter">توصية الذكاء الاصطناعي</h4>
                            <p className="text-on-surface-variant text-sm font-body">النسخة B تحقق أداءً أفضل بنسبة 38% في معدل النقر. ننصح باعتمادها كنسخة أساسية.</p>
                          </div>
                          <button className="px-8 py-4 rounded-2xl bg-primary text-white font-label font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                            اعتماد النسخة B
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Schedule Modal */}
          <AnimatePresence>
            {schedulingPost && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSchedulingPost(null)}
                  className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md p-10 rounded-[3rem] bg-surface border border-outline-variant/10 shadow-[0_30px_100px_rgba(0,0,0,0.2)] space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-headline font-black text-on-surface uppercase tracking-tighter">جدولة المنشور</h3>
                    </div>
                    <button 
                      onClick={() => setSchedulingPost(null)}
                      className="p-3 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-all active:scale-90"
                    >
                      <CloseIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant/5 text-sm font-body text-on-surface-variant leading-relaxed italic">
                      "{schedulingPost.content.substring(0, 120)}..."
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant">التاريخ</label>
                        <input 
                          type="date" 
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-body text-sm"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant">الوقت</label>
                        <input 
                          type="time" 
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/10 px-5 py-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-body text-sm"
                        />
                      </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant/5 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-on-surface text-surface">
                        {PLATFORM_OPTIONS.find(opt => opt.id === schedulingPost.platform)?.icon || <Globe className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-label font-black uppercase tracking-widest text-outline-variant">المنصة المختارة</span>
                        <span className="text-sm font-headline font-black text-on-surface">{schedulingPost.platform}</span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleSchedule}
                    disabled={isScheduling || !scheduleDate || !scheduleTime || scheduledSuccess}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-5 rounded-2xl font-label font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl",
                      scheduledSuccess 
                        ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                        : "bg-primary text-white shadow-primary/20"
                    )}
                  >
                    {isScheduling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : scheduledSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        تمت الجدولة بنجاح
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-5 h-5" />
                        تأكيد الجدولة
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ title, type, icon, items, onCopy, onSave, onSchedule, onABTest, isCopied, savingId, selectingForAB, abVariationA }: any) => (
  <div className="p-10 rounded-[3rem] bg-surface-container-lowest shadow-[0_20px_60px_rgba(0,0,0,0.06)] space-y-8 border border-outline-variant/10 group relative overflow-hidden hover:shadow-[0_30px_80px_rgba(0,0,0,0.1)] transition-all duration-500">
    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/10 transition-all"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center gap-5">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform ring-1 ring-primary/20">
          {icon}
        </div>
        <h3 className="font-headline font-black text-2xl text-on-surface tracking-tighter">{title}</h3>
      </div>
      <button
        onClick={() => onCopy(items.join('\n'))}
        className="p-3 rounded-full transition-all hover:bg-surface-container-high text-on-surface-variant active:scale-90"
      >
        {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>

    <ul className="space-y-4 relative z-10">
      {items.map((item: string, i: number) => {
        const itemId = `${type}-${i}`;
        const isSelectedA = abVariationA === item;
        return (
          <li key={i} className={cn(
            "text-sm flex items-start gap-5 group/item p-6 rounded-[2.5rem] transition-all border border-outline-variant/5 hover:border-primary/20 hover:bg-surface-container-low font-body", 
            "text-on-surface-variant bg-surface-container-low/30",
            isSelectedA && "bg-emerald-500/5 border-emerald-500/20 shadow-sm"
          )}>
            <div className="w-10 h-10 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0 group-hover/item:bg-primary/10 transition-colors shadow-sm">
              <span className="font-headline font-black text-xs text-outline-variant group-hover/item:text-primary">{i + 1}</span>
            </div>
            <span className="flex-1 leading-relaxed font-medium pt-1">{item}</span>
            <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0">
              <button
                onClick={() => onSave(item, itemId)}
                className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 transition-all text-on-surface-variant hover:scale-110 active:scale-90 hover:text-red-500"
                title="حفظ في المفضلة"
              >
                {savingId === itemId ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onSchedule(item)}
                className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 transition-all text-on-surface-variant hover:scale-110 active:scale-90 hover:text-primary"
                title="جدولة المنشور"
              >
                <Clock className="w-4 h-4" />
              </button>
              {type === 'caption' && (
                <button
                  onClick={() => onABTest(item)}
                  className={cn(
                    "p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 transition-all hover:scale-110 active:scale-90", 
                    isSelectedA ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-on-surface-variant hover:text-primary"
                  )}
                  title={abVariationA ? "اختيار كخيار B" : "اختيار كخيار A"}
                >
                  <Split className="w-4 h-4" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);
