import React, { useState } from 'react';
import { generateSocialContent, refineContent } from '../services/geminiService';
import { ContentResults, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Zap, Send, Loader2, Copy, Check, TrendingUp, Calendar, Video, FileText, Hash, Star, Info, Heart, Share2, Download, Layout, Smartphone, Globe, RefreshCcw, Wand2, Instagram, Twitter, Linkedin, Facebook, Youtube, MessageSquare, Pin, Ghost, Shield, ChevronDown, X as CloseIcon, Clock, Split, BarChart2, ThumbsUp, MessageCircle, Trash2, Trophy, Crown, Target, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { GoogleAd } from './GoogleAd';
import { SocialPreview } from './SocialPreview';

interface DashboardProps {
  user: UserProfile;
  theme: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const DASHBOARD_TABS: NavigationItem[] = [
  { id: 'strategy', label: 'الاستراتيجية', icon: <Target className="w-4 h-4" /> },
  { id: 'ideas', label: 'الأفكار', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'content', label: 'المحتوى', icon: <FileText className="w-4 h-4" /> },
  { id: 'calendar', label: 'الجدول الزمني', icon: <Calendar className="w-4 h-4" /> },
  { id: 'abtest', label: 'اختبار A/B', icon: <Split className="w-4 h-4" /> },
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

export const Dashboard: React.FC<DashboardProps> = ({ user, theme }) => {
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
    switch (theme) {
      case 'light': return 'bg-white/50 border-zinc-200';
      case 'emerald': return 'bg-emerald-900/50 border-emerald-800';
      case 'rose': return 'bg-rose-900/50 border-rose-800';
      case 'amber': return 'bg-amber-900/50 border-amber-800';
      case 'blue': return 'bg-blue-900/50 border-blue-800';
      default: return 'bg-zinc-900/50 border-zinc-800';
    }
  };

  const getInputClasses = () => {
    switch (theme) {
      case 'light': return 'bg-zinc-100 border-zinc-200 text-zinc-950 focus:ring-zinc-300';
      case 'emerald': return 'bg-emerald-950 border-emerald-800 text-emerald-50 focus:ring-emerald-700';
      case 'rose': return 'bg-rose-950 border-rose-800 text-rose-50 focus:ring-rose-700';
      case 'amber': return 'bg-amber-950 border-amber-800 text-amber-50 focus:ring-amber-700';
      case 'blue': return 'bg-blue-950 border-blue-800 text-blue-50 focus:ring-blue-700';
      default: return 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-zinc-700';
    }
  };

  const getButtonClasses = (active: boolean) => {
    if (active) {
      return theme === 'light' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-950';
    }
    return theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:border-zinc-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700';
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
      <header className="space-y-2">
        <h1 className={cn("text-4xl font-black tracking-tighter uppercase", getTextClasses())}>
          Vantage <span className={cn("italic font-medium", getMutedTextClasses())}>AI</span>
        </h1>
        <p className={cn("text-sm font-medium", getMutedTextClasses())}>المنصة العالمية الرائدة للذكاء الاستراتيجي وصناعة المحتوى.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleGenerate} className={cn("p-6 border rounded-3xl space-y-6", getSurfaceClasses())}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={cn("text-xs font-semibold uppercase tracking-wider", getMutedTextClasses())}>المجال</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="مثال: لياقة بدنية، تقنية، طعام"
                  className={cn("w-full rounded-xl px-4 py-3 border outline-none transition-all", getInputClasses())}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={cn("text-xs font-semibold uppercase tracking-wider", getMutedTextClasses())}>نوع النشاط</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className={cn("w-full rounded-xl px-4 py-3 border outline-none transition-all", getInputClasses())}
                >
                  <option value="marketing">تسويق</option>
                  <option value="education">تعليم</option>
                  <option value="entertainment">ترفيه</option>
                  <option value="personal-brand">علامة تجارية شخصية</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={cn("text-xs font-semibold uppercase tracking-wider", getMutedTextClasses())}>الجمهور المستهدف (اختياري)</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="مثال: جيل زد، رواد أعمال"
                  className={cn("w-full rounded-xl px-4 py-3 border outline-none transition-all", getInputClasses())}
                />
              </div>

              <div className="space-y-3">
                <label className={cn("text-xs font-semibold uppercase tracking-wider", getMutedTextClasses())}>نبرة الصوت</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-2",
                        getButtonClasses(tone === t.id)
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className={cn("text-xs font-semibold uppercase tracking-wider", getMutedTextClasses())}>مدة التقويم</label>
                <div className="flex gap-2">
                  {[7, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-xs font-bold transition-all",
                        getButtonClasses(duration === d)
                      )}
                    >
                      {d === 7 ? '٧ أيام' : '٣٠ يوم (شهر)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 relative">
                <label className={cn("text-xs font-semibold uppercase tracking-wider", getMutedTextClasses())}>المنصات</label>
                <div 
                  className={cn(
                    "w-full rounded-xl px-4 py-3 border outline-none transition-all cursor-pointer flex flex-wrap gap-2 items-center min-h-[50px]", 
                    getInputClasses()
                  )}
                  onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                >
                  {platforms.length === 0 ? (
                    <span className="text-zinc-500 text-sm">اختر المنصات...</span>
                  ) : (
                    platforms.map(p => (
                      <span 
                        key={p} 
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5",
                          theme === 'light' ? 'bg-zinc-200 text-zinc-950' : 'bg-zinc-800 text-zinc-100'
                        )}
                      >
                        {PLATFORM_OPTIONS.find(opt => opt.id === p)?.icon}
                        {p}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlatform(p);
                          }}
                          className="hover:text-red-400 transition-colors"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                  <ChevronDown className={cn("w-4 h-4 mr-auto transition-transform", isPlatformDropdownOpen && "rotate-180")} />
                </div>

                <AnimatePresence>
                  {isPlatformDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "absolute z-50 w-full mt-2 border rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto",
                        theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                      )}
                    >
                      <div className="p-2 grid grid-cols-1 gap-1">
                        {PLATFORM_OPTIONS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePlatform(p.id)}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between",
                              platforms.includes(p.id) 
                                ? (theme === 'light' ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-100')
                                : (theme === 'light' ? 'hover:bg-zinc-50 text-zinc-600' : 'hover:bg-zinc-800/50 text-zinc-400')
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {p.icon}
                              {p.id}
                            </div>
                            {platforms.includes(p.id) && <Check className="w-4 h-4 text-green-500" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !niche}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group shadow-xl", 
                theme === 'light' ? 'bg-zinc-950 text-zinc-100 hover:bg-zinc-900' : 'bg-zinc-100 text-zinc-950 hover:bg-white'
              )}
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
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      جاري تحليل البيانات...
                    </motion.span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>إنشاء الاستراتيجية الذكية</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Shimmer effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                animate={loading ? { translateX: ['-100%', '200%'] } : {}}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.button>
          </form>

          {/* Trending Section */}
          <div className={cn("p-6 border rounded-3xl space-y-4", getSurfaceClasses())}>
            <div className={cn("flex items-center gap-2", getMutedTextClasses())}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">المجالات الرائجة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['أدوات الذكاء الاصطناعي', 'حياة مستدامة', 'العمل عن بعد', 'التأمل'].map((t) => (
                <button
                  key={t}
                  onClick={() => setNiche(t)}
                  className={cn("px-3 py-1.5 rounded-full text-xs transition-colors", theme === 'light' ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Ad Section */}
          <div className="p-6 bg-zinc-900/20 border border-zinc-800/30 rounded-3xl overflow-hidden">
            <div className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest mb-4">إعلان ممول</div>
            <GoogleAd slot="1234567890" className="min-h-[250px]" />
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="space-y-6"
              >
                {/* Tabbed Navigation */}
                <motion.div 
                  variants={itemVariants}
                  className={cn("flex items-center gap-1 p-1 border rounded-2xl overflow-x-auto no-scrollbar", theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800')}
                >
                  {DASHBOARD_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative",
                        activeTab === tab.id
                          ? (theme === 'light' ? "bg-white text-zinc-950 shadow-sm" : "bg-zinc-800 text-zinc-100 shadow-lg")
                          : (theme === 'light' ? "text-zinc-500 hover:text-zinc-700" : "text-zinc-500 hover:text-zinc-300")
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className={cn("absolute inset-0 rounded-xl border-2", theme === 'light' ? "border-zinc-950/5" : "border-white/5")}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  ))}
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'strategy' && results && (
                    <motion.div
                      key="strategy"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      {/* Score Card */}
                      <motion.div 
                        variants={itemVariants}
                        className={cn("p-6 rounded-3xl border flex items-center justify-between", theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700')}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-medium uppercase tracking-wider", getMutedTextClasses())}>درجة الاستراتيجية</h3>
                            <div className="relative group">
                              <Info className={cn("w-3.5 h-3.5 cursor-help transition-colors", getMutedTextClasses())} />
                              <div className={cn("absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 border rounded-xl text-[10px] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 shadow-2xl leading-relaxed", theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400')}>
                                تشير هذه الدرجة إلى احتمالية النجاح المتوقعة لهذه الاستراتيجية، بناءً على مقاييس التفاعل وتحليل الاتجاهات.
                                <div className={cn("absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent", theme === 'light' ? 'border-t-zinc-200' : 'border-t-zinc-800')} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-4xl font-black", getTextClasses())}>{results.score}</span>
                            <span className={getMutedTextClasses()}>/ 100</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "w-5 h-5",
                                  s <= Math.round(results.score / 20) 
                                    ? (theme === 'light' ? "text-zinc-950 fill-zinc-950" : "text-zinc-100 fill-zinc-100") 
                                    : (theme === 'light' ? "text-zinc-200" : "text-zinc-700")
                                )}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(JSON.stringify(results, null, 2), 'all')}
                              className={cn("p-3 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold", theme === 'light' ? 'bg-zinc-200 text-zinc-950 hover:bg-zinc-300' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700')}
                              title="نسخ كل شيء"
                            >
                              {copied === 'all' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                              <span className="hidden sm:inline">نسخ الكل</span>
                            </button>
                            <button 
                              onClick={exportStrategy}
                              className={cn("p-3 rounded-xl transition-colors", theme === 'light' ? 'bg-zinc-950 text-zinc-100 hover:bg-black' : 'bg-zinc-100 text-zinc-950 hover:bg-white')}
                              title="تصدير الاستراتيجية"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>

                      {/* Refine Section */}
                      <motion.div 
                        variants={itemVariants}
                        className={cn("p-8 border rounded-3xl space-y-6", getSurfaceClasses())}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <h3 className={cn("text-lg font-bold", getTextClasses())}>تحسين الاستراتيجية</h3>
                        </div>
                        <div className="flex gap-3">
                          <textarea
                            value={refineText}
                            onChange={(e) => setRefineText(e.target.value)}
                            placeholder="مثال: ركز أكثر على تيك توك، أو اجعل الأسلوب أكثر مرحاً..."
                            rows={2}
                            className={cn("flex-1 px-4 py-3 rounded-xl border text-sm transition-all outline-none resize-none", theme === 'light' ? 'bg-zinc-50 border-zinc-200 focus:border-zinc-950' : 'bg-zinc-950 border-zinc-800 focus:border-zinc-100')}
                          />
                          <motion.button
                            onClick={handleRefine}
                            disabled={refining || !refineText}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all h-fit self-end",
                              theme === 'light' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-950',
                              (refining || !refineText) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {refining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                            <span>تعديل</span>
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Advanced Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.hook && (
                          <motion.div 
                            variants={itemVariants}
                            className={cn("p-6 border rounded-3xl space-y-4", getSurfaceClasses())}
                          >
                            <h3 className={cn("font-bold flex items-center gap-2", getTextClasses())}>
                              <Zap className="w-5 h-5 text-amber-400" />
                              الخُطّاف (Hook)
                            </h3>
                            <p className={cn("text-sm leading-relaxed", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>
                              {results.hook}
                            </p>
                          </motion.div>
                        )}
                        {results.script && (
                          <motion.div 
                            variants={itemVariants}
                            className={cn("p-6 border rounded-3xl space-y-4", getSurfaceClasses())}
                          >
                            <h3 className={cn("font-bold flex items-center gap-2", getTextClasses())}>
                              <Video className={cn("w-5 h-5", getMutedTextClasses())} />
                              سيناريو الفيديو
                            </h3>
                            <pre className={cn("text-sm whitespace-pre-wrap font-sans leading-relaxed", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>
                              {results.script}
                            </pre>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'ideas' && results && (
                    <motion.div
                      key="ideas"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {/* Post Ideas */}
                      <motion.div variants={itemVariants}>
                        <ResultCard
                          title="أفكار المنشورات"
                          type="post"
                          theme={theme}
                          icon={<FileText className="w-5 h-5" />}
                          items={results.postIdeas}
                          onCopy={(text: string) => copyToClipboard(text, 'posts')}
                          onSave={(content: string, id: string) => handleSaveFavorite(content, 'post', id)}
                          onSchedule={(content: string) => setSchedulingPost({ content, platform: platforms[0] || 'Instagram' })}
                          onABTest={handleSelectForAB}
                          isCopied={copied === 'posts'}
                          savingId={saving}
                          selectingForAB={selectingForAB}
                          abVariationA={abVariationA}
                        />
                      </motion.div>

                      {/* Video Ideas */}
                      <motion.div variants={itemVariants}>
                        <ResultCard
                          title="أفكار الفيديوهات"
                          type="video"
                          theme={theme}
                          icon={<Video className="w-5 h-5" />}
                          items={results.videoIdeas}
                          onCopy={(text: string) => copyToClipboard(text, 'videos')}
                          onSave={(content: string, id: string) => handleSaveFavorite(content, 'video', id)}
                          onSchedule={(content: string) => setSchedulingPost({ content, platform: platforms[0] || 'TikTok' })}
                          onABTest={handleSelectForAB}
                          isCopied={copied === 'videos'}
                          savingId={saving}
                          selectingForAB={selectingForAB}
                          abVariationA={abVariationA}
                        />
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'content' && results && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      {/* Preview Section */}
                      <motion.div 
                        variants={itemVariants}
                        className={cn("p-8 border rounded-3xl space-y-8", getSurfaceClasses())}
                      >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className={cn("text-xl font-bold flex items-center gap-2", getTextClasses())}>
                          <Smartphone className={cn("w-5 h-5", getMutedTextClasses())} />
                          معاينة المحتوى
                        </h3>
                        <p className={cn("text-sm", getMutedTextClasses())}>كيف سيظهر منشورك على وسائل التواصل الاجتماعي.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((p) => (
                          <button
                            key={p}
                            onClick={() => setPreviewPlatform(p)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2",
                              previewPlatform === p 
                                ? (theme === 'light' ? "bg-zinc-950 border-zinc-950 text-zinc-100" : "bg-zinc-100 border-zinc-100 text-zinc-950") 
                                : (theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-950 border-zinc-800 text-zinc-500")
                            )}
                          >
                            {PLATFORM_OPTIONS.find(opt => opt.id === p)?.icon}
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                      <div className="space-y-4">
                        <SocialPreview 
                          displayName={user.displayName || 'مستخدم'} 
                          photoURL={user.photoURL}
                          caption={results.captions[activePreview]}
                          hashtags={results.hashtags}
                          niche={niche}
                          platform={previewPlatform}
                          onSave={() => handleSaveFavorite(results.captions[activePreview], 'caption', `preview-${activePreview}`)}
                          isSaving={saving === `preview-${activePreview}`}
                          onSchedule={() => setSchedulingPost({ content: results.captions[activePreview], platform: previewPlatform })}
                        />
                        <div className="flex justify-center gap-2">
                          {results.captions.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActivePreview(i)}
                              className={cn(
                                "w-8 h-8 rounded-lg border text-xs font-bold transition-all",
                                activePreview === i 
                                  ? (theme === 'light' ? "bg-zinc-950 border-zinc-950 text-zinc-100" : "bg-zinc-100 border-zinc-100 text-zinc-950") 
                                  : (theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-950 border-zinc-800 text-zinc-500")
                              )}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-6">
                        <div className={cn("p-6 border rounded-2xl space-y-4", theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800')}>
                          <div className={cn("flex items-center gap-2 font-bold", getTextClasses())}>
                            <FileText className={cn("w-4 h-4", getMutedTextClasses())} />
                            النص المختار
                          </div>
                          <p className={cn("text-sm leading-relaxed", theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')}>{results.captions[activePreview]}</p>
                          <button
                            onClick={() => copyToClipboard(results.captions[activePreview], `preview-${activePreview}`)}
                            className={cn("w-full py-2 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800')}
                          >
                            {copied === `preview-${activePreview}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            نسخ النص
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className={cn("p-4 border rounded-2xl space-y-1", theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/50 border-zinc-800/50')}>
                            <div className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>المنصة المختارة</div>
                            <div className={cn("text-sm font-bold flex items-center gap-2", getTextClasses())}>
                              {PLATFORM_OPTIONS.find(opt => opt.id === previewPlatform)?.icon}
                              {previewPlatform}
                            </div>
                          </div>
                          <div className={cn("p-4 border rounded-2xl space-y-1", theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/50 border-zinc-800/50')}>
                            <div className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>وقت النشر المقترح</div>
                            <div className={cn("text-sm font-bold", getTextClasses())}>٧:٠٠ مساءً</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                      {/* Captions */}
                      <motion.div variants={itemVariants}>
                        <ResultCard
                          title="التعليقات"
                          type="caption"
                          theme={theme}
                          icon={<Send className="w-5 h-5" />}
                          items={results.captions}
                          onCopy={(text: string) => copyToClipboard(text, 'captions')}
                          onSave={(content: string, id: string) => handleSaveFavorite(content, 'caption', id)}
                          onSchedule={(content: string) => setSchedulingPost({ content, platform: previewPlatform })}
                          onABTest={handleSelectForAB}
                          isCopied={copied === 'captions'}
                          savingId={saving}
                          selectingForAB={selectingForAB}
                          abVariationA={abVariationA}
                        />
                      </motion.div>

                      {/* Hashtags */}
                      <motion.div 
                        variants={itemVariants}
                        className={cn("p-6 border rounded-3xl space-y-4", getSurfaceClasses())}
                      >
                    <div className="flex items-center justify-between">
                      <div className={cn("flex items-center gap-2", getTextClasses())}>
                        <Hash className="w-5 h-5" />
                        <h3 className="font-bold">الوسوم</h3>
                      </div>
                      <button
                        onClick={() => copyToClipboard(results.hashtags.join(' '), 'hashtags')}
                        className={cn("p-2 rounded-lg transition-colors", theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800')}
                      >
                        {copied === 'hashtags' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className={cn("w-4 h-4", getMutedTextClasses())} />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {results.hashtags.map((tag, i) => (
                        <span key={i} className={cn("px-3 py-1 border rounded-full text-xs", theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400')}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'calendar' && results && results.calendar && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <motion.div 
                        variants={itemVariants}
                        className={cn("p-8 border rounded-3xl space-y-6", getSurfaceClasses())}
                      >
                      <div className="flex items-center justify-between">
                        <h3 className={cn("text-xl font-bold flex items-center gap-2", getTextClasses())}>
                          <Calendar className={cn("w-5 h-5", getMutedTextClasses())} />
                          تقويم المحتوى ({results.calendar.length} يوم)
                        </h3>
                        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>
                          <Globe className="w-3 h-3" />
                          {results.calendar.length > 7 ? 'خطة شهرية' : 'خطة أسبوعية'}
                        </div>
                      </div>
                      
                      <div className={cn(
                        "grid gap-4",
                        results.calendar.length > 7 
                          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
                          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
                      )}>
                        {results.calendar.map((day) => (
                          <div key={day.day} className={cn("p-4 border rounded-2xl space-y-3 transition-all group", theme === 'light' ? 'bg-white border-zinc-200 hover:border-zinc-300' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700')}>
                            <div className="flex items-center justify-between">
                              <span className={cn("text-xs font-black transition-colors", theme === 'light' ? 'text-zinc-300 group-hover:text-zinc-500' : 'text-zinc-700 group-hover:text-zinc-500')}>يوم {day.day}</span>
                              <span className={cn("px-2 py-0.5 border rounded text-[8px] font-bold uppercase", theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500')}>{day.platform}</span>
                            </div>
                            <p className={cn("text-xs font-medium leading-relaxed line-clamp-3", theme === 'light' ? 'text-zinc-700' : 'text-zinc-300')}>{day.topic}</p>
                            <div className={cn("pt-2 border-t", theme === 'light' ? 'border-zinc-100' : 'border-zinc-900')}>
                              <span className={cn("text-[9px] font-bold uppercase tracking-tighter", theme === 'light' ? 'text-zinc-400' : 'text-zinc-600')}>{day.format}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                  {activeTab === 'abtest' && (
                    <motion.div
                      key="abtest"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className={cn("text-2xl font-black tracking-tighter", getTextClasses())}>اختبارات A/B</h2>
                          <p className={cn("text-sm font-medium", getMutedTextClasses())}>قارن بين نسختين من المحتوى لمعرفة الأفضل أداءً.</p>
                        </div>
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest", theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500')}>
                          <BarChart2 className="w-3 h-3" />
                          تحليلات مباشرة
                        </div>
                      </div>

                      {abTests.length === 0 ? (
                        <div className={cn("p-12 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4", theme === 'light' ? 'border-zinc-200 text-zinc-400' : 'border-zinc-800 text-zinc-600')}>
                          <Split className="w-12 h-12 opacity-20" />
                          <p className="max-w-xs">لا توجد اختبارات A/B نشطة. اختر تعليقين من النتائج أعلاه لبدء الاختبار.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {abTests.map((test) => {
                            const scoreA = test.variationA.likes + test.variationA.comments + test.variationA.shares;
                            const scoreB = test.variationB.likes + test.variationB.comments + test.variationB.shares;
                            const totalScore = scoreA + scoreB;
                            const isWinnerA = test.status === 'completed' && scoreA > scoreB;
                            const isWinnerB = test.status === 'completed' && scoreB > scoreA;
                            const isLeadingA = test.status === 'active' && scoreA > scoreB;
                            const isLeadingB = test.status === 'active' && scoreB > scoreA;

                            return (
                              <motion.div
                                key={test.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                  "p-6 border rounded-[2.5rem] space-y-6 relative group transition-all duration-500", 
                                  getSurfaceClasses(),
                                  (isWinnerA || isWinnerB) && "ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                )}
                              >
                                <button 
                                  onClick={() => handleDeleteABTest(test.id)}
                                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-500/10 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>{test.niche}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <span className={cn(
                                      "text-[10px] font-bold uppercase tracking-widest",
                                      test.status === 'active' ? "text-emerald-500" : "text-zinc-500"
                                    )}>
                                      {test.status === 'active' ? 'نشط' : 'مكتمل'}
                                    </span>
                                  </div>
                                  {(isWinnerA || isWinnerB) && (
                                    <motion.div 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black tracking-tighter"
                                    >
                                      <Trophy className="w-3 h-3" />
                                      تم تحديد الفائز
                                    </motion.div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  {/* Variation A */}
                                  <div className={cn(
                                    "space-y-4 p-4 rounded-2xl border transition-all relative overflow-hidden",
                                    isWinnerA ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20" : 
                                    isLeadingA ? "bg-blue-500/5 border-blue-500/20" : "border-transparent"
                                  )}>
                                    {isWinnerA && (
                                      <div className="absolute -top-1 -left-1">
                                        <div className="bg-emerald-500 text-white p-1.5 rounded-br-xl shadow-lg">
                                          <Crown className="w-3 h-3" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-500">النسخة A</span>
                                        {isLeadingA && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded-full font-bold">متصدر</span>}
                                      </div>
                                      {test.status === 'active' && (
                                        <div className="flex gap-2">
                                          <button onClick={() => handleUpdateABMetric(test.id, 'A', 'likes')} className="p-1 hover:text-emerald-500 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                                          <button onClick={() => handleUpdateABMetric(test.id, 'A', 'comments')} className="p-1 hover:text-blue-500 transition-colors"><MessageCircle className="w-3 h-3" /></button>
                                          <button onClick={() => handleUpdateABMetric(test.id, 'A', 'shares')} className="p-1 hover:text-pink-500 transition-colors"><Share2 className="w-3 h-3" /></button>
                                        </div>
                                      )}
                                    </div>
                                    <div className={cn("p-4 rounded-2xl border text-xs leading-relaxed h-24 overflow-y-auto", theme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-950 border-zinc-800')}>
                                      {test.variationA.content}
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {test.variationA.likes}</div>
                                      <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {test.variationA.comments}</div>
                                      <div className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {test.variationA.shares}</div>
                                    </div>
                                  </div>

                                  {/* Variation B */}
                                  <div className={cn(
                                    "space-y-4 p-4 rounded-2xl border transition-all relative overflow-hidden",
                                    isWinnerB ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20" : 
                                    isLeadingB ? "bg-blue-500/5 border-blue-500/20" : "border-transparent"
                                  )}>
                                    {isWinnerB && (
                                      <div className="absolute -top-1 -left-1">
                                        <div className="bg-emerald-500 text-white p-1.5 rounded-br-xl shadow-lg">
                                          <Crown className="w-3 h-3" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-500">النسخة B</span>
                                        {isLeadingB && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded-full font-bold">متصدر</span>}
                                      </div>
                                      {test.status === 'active' && (
                                        <div className="flex gap-2">
                                          <button onClick={() => handleUpdateABMetric(test.id, 'B', 'likes')} className="p-1 hover:text-emerald-500 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                                          <button onClick={() => handleUpdateABMetric(test.id, 'B', 'comments')} className="p-1 hover:text-blue-500 transition-colors"><MessageCircle className="w-3 h-3" /></button>
                                          <button onClick={() => handleUpdateABMetric(test.id, 'B', 'shares')} className="p-1 hover:text-pink-500 transition-colors"><Share2 className="w-3 h-3" /></button>
                                        </div>
                                      )}
                                    </div>
                                    <div className={cn("p-4 rounded-2xl border text-xs leading-relaxed h-24 overflow-y-auto", theme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-950 border-zinc-800')}>
                                      {test.variationB.content}
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {test.variationB.likes}</div>
                                      <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {test.variationB.comments}</div>
                                      <div className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {test.variationB.shares}</div>
                                    </div>
                                  </div>
                                </div>

                                {test.status === 'active' && (
                                  <button
                                    onClick={() => handleCloseABTest(test.id)}
                                    className={cn(
                                      "w-full py-3 rounded-2xl text-xs font-bold transition-all border",
                                      theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-950 hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800'
                                    )}
                                  >
                                    إنهاء الاختبار وتحديد الفائز
                                  </button>
                                )}

                                {/* Performance Bar */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                    <span>النسخة A ({totalScore > 0 ? Math.round((scoreA / totalScore) * 100) : 50}%)</span>
                                    <span>النسخة B ({totalScore > 0 ? Math.round((scoreB / totalScore) * 100) : 50}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${totalScore > 0 ? (scoreA / totalScore) * 100 : 50}%` }}
                                      className="h-full bg-blue-500"
                                    />
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${totalScore > 0 ? (scoreB / totalScore) * 100 : 50}%` }}
                                      className="h-full bg-emerald-500"
                                    />
                                  </div>
                                </div>

                                {/* Winner Indicator & Actions */}
                                <div className="flex items-center gap-3">
                                  {test.status === 'active' ? (
                                    <button
                                      onClick={() => handleCloseABTest(test.id)}
                                      className={cn(
                                        "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                        theme === 'light' ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                                      )}
                                    >
                                      إغلاق الاختبار وتحديد الفائز
                                    </button>
                                  ) : (
                                    <div className={cn(
                                      "flex-1 p-3 rounded-2xl border text-center text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                                      scoreA > scoreB
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                        : scoreB > scoreA
                                          ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                          : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                                    )}>
                                      {scoreA > scoreB || scoreB > scoreA ? <Trophy className="w-3 h-3" /> : null}
                                      {scoreA === scoreB 
                                        ? 'تعادل في الأداء' 
                                        : `النسخة ${scoreA > scoreB ? 'A' : 'B'} هي الفائزة`}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className={cn("h-full min-h-[400px] flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl space-y-4", theme === 'light' ? 'border-zinc-200 text-zinc-400' : 'border-zinc-800 text-zinc-600')}>
                <Zap className="w-12 h-12 opacity-20" />
                <p className="text-center max-w-xs">أدخل مجالك ونوع نشاطك لإنشاء استراتيجية محتوى مخصصة.</p>
              </div>
            )}
          </AnimatePresence>

          {/* A/B Testing Section Removed from here and moved into tabs */}

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
                  className={cn(
                    "relative w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl space-y-6",
                    theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl", theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-900')}>
                        <Clock className={cn("w-5 h-5", theme === 'light' ? 'text-zinc-950' : 'text-zinc-100')} />
                      </div>
                      <h3 className={cn("text-xl font-bold", getTextClasses())}>جدولة المنشور</h3>
                    </div>
                    <button 
                      onClick={() => setSchedulingPost(null)}
                      className={cn("p-2 rounded-full transition-colors", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className={cn("p-4 rounded-2xl border text-sm italic", theme === 'light' ? 'bg-zinc-50 border-zinc-100 text-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-400')}>
                      "{schedulingPost.content.substring(0, 100)}..."
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>التاريخ</label>
                        <input 
                          type="date" 
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className={cn("w-full rounded-xl px-4 py-3 border outline-none text-sm", getInputClasses())}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>الوقت</label>
                        <input 
                          type="time" 
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className={cn("w-full rounded-xl px-4 py-3 border outline-none text-sm", getInputClasses())}
                        />
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-2xl border flex items-center gap-3", theme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-900 border-zinc-800')}>
                      <div className="p-2 rounded-lg bg-zinc-800">
                        {PLATFORM_OPTIONS.find(opt => opt.id === schedulingPost.platform)?.icon || <Globe className="w-4 h-4 text-zinc-400" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest", getMutedTextClasses())}>المنصة</span>
                        <span className={cn("text-xs font-bold", getTextClasses())}>{schedulingPost.platform}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSchedule}
                    disabled={isScheduling || !scheduleDate || !scheduleTime || scheduledSuccess}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                      scheduledSuccess 
                        ? "bg-green-500 text-white" 
                        : (theme === 'light' ? 'bg-zinc-950 text-zinc-100 hover:bg-black' : 'bg-zinc-100 text-zinc-950 hover:bg-white')
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
                        <Clock className="w-5 h-5" />
                        تأكيد الجدولة
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ title, type, icon, items, onCopy, onSave, onSchedule, onABTest, isCopied, savingId, selectingForAB, abVariationA, theme }: any) => (
  <div className={cn("p-6 border rounded-3xl space-y-4", theme === 'light' ? 'bg-white/50 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800')}>
    <div className="flex items-center justify-between">
      <div className={cn("flex items-center gap-2 font-bold", theme === 'light' ? 'text-zinc-950' : 'text-zinc-100')}>
        {icon}
        <h3>{title}</h3>
      </div>
      <button
        onClick={() => onCopy(items.join('\n'))}
        className={cn("p-2 rounded-lg transition-colors", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
      >
        {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className={cn("w-4 h-4", theme === 'light' ? 'text-zinc-400' : 'text-zinc-500')} />}
      </button>
    </div>
    <ul className="space-y-3">
      {items.map((item: string, i: number) => {
        const itemId = `${type}-${i}`;
        const isSelectedA = abVariationA === item;
        return (
          <li key={i} className={cn(
            "text-sm flex items-start gap-3 group p-2 rounded-xl transition-all", 
            theme === 'light' ? 'text-zinc-600' : 'text-zinc-400',
            isSelectedA && "bg-emerald-500/10 border border-emerald-500/20"
          )}>
            <span className={cn("font-mono text-xs mt-1 shrink-0", theme === 'light' ? 'text-zinc-300' : 'text-zinc-700')}>0{i + 1}</span>
            <span className="flex-1">{item}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={() => onSave(item, itemId)}
                className={cn("p-1.5 rounded-md transition-all", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
                title="حفظ في المفضلة"
              >
                {savingId === itemId ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Heart className={cn("w-3.5 h-3.5 hover:text-red-400", theme === 'light' ? 'text-zinc-300' : 'text-zinc-600')} />
                )}
              </button>
              <button
                onClick={() => onSchedule(item)}
                className={cn("p-1.5 rounded-md transition-all", theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800')}
                title="جدولة المنشور"
              >
                <Clock className={cn("w-3.5 h-3.5 hover:text-blue-400", theme === 'light' ? 'text-zinc-300' : 'text-zinc-600')} />
              </button>
              {type === 'caption' && (
                <button
                  onClick={() => onABTest(item)}
                  className={cn(
                    "p-1.5 rounded-md transition-all", 
                    theme === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800',
                    isSelectedA ? "text-emerald-500 bg-emerald-500/10" : (theme === 'light' ? 'text-zinc-300' : 'text-zinc-600')
                  )}
                  title={abVariationA ? "اختيار كخيار B" : "اختيار كخيار A"}
                >
                  <Split className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);
