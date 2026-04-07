import React, { useState } from 'react';
import { generateSocialContent } from '../services/geminiService';
import { ContentResults, UserProfile } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Send, Loader2, Copy, Check, TrendingUp, Calendar, Video, FileText, Hash, Star, Info, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { GoogleAd } from './GoogleAd';

interface DashboardProps {
  user: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [niche, setNiche] = useState(user.preferences.niche || '');
  const [activityType, setActivityType] = useState('marketing');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ContentResults | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche) return;

    setLoading(true);
    try {
      const data = await generateSocialContent(niche, activityType, targetAudience);
      setResults(data);

      await addDoc(collection(db, 'generations'), {
        userId: user.uid,
        niche,
        activityType,
        targetAudience,
        results: data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          مهندس <span className="text-zinc-500 italic">المحتوى</span>
        </h1>
        <p className="text-zinc-500">أنشئ استراتيجيات تواصل اجتماعي عالمية في ثوانٍ.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleGenerate} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">المجال</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="مثال: لياقة بدنية، تقنية، طعام"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-zinc-700 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">نوع النشاط</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-zinc-700 outline-none transition-all"
                >
                  <option value="marketing">تسويق</option>
                  <option value="education">تعليم</option>
                  <option value="entertainment">ترفيه</option>
                  <option value="personal-brand">علامة تجارية شخصية</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">الجمهور المستهدف (اختياري)</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="مثال: جيل زد، رواد أعمال"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-zinc-700 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !niche}
              className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  إنشاء الاستراتيجية
                </>
              )}
            </button>
          </form>

          {/* Trending Section */}
          <div className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">المجالات الرائجة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['أدوات الذكاء الاصطناعي', 'حياة مستدامة', 'العمل عن بعد', 'التأمل'].map((t) => (
                <button
                  key={t}
                  onClick={() => setNiche(t)}
                  className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-full text-xs text-zinc-300 transition-colors"
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <div className="p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">درجة الاستراتيجية</h3>
                      <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help hover:text-zinc-400 transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 shadow-2xl leading-relaxed">
                          تشير هذه الدرجة إلى احتمالية النجاح المتوقعة لهذه الاستراتيجية، بناءً على مقاييس التفاعل وتحليل الاتجاهات.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-black text-zinc-100">{results.score}</span>
                      <span className="text-zinc-500 font-medium">/ 100</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-5 h-5",
                          s <= Math.round(results.score / 20) ? "text-zinc-100 fill-zinc-100" : "text-zinc-700"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Post Ideas */}
                  <ResultCard
                    title="أفكار المنشورات"
                    type="post"
                    icon={<FileText className="w-5 h-5" />}
                    items={results.postIdeas}
                    onCopy={(text) => copyToClipboard(text, 'posts')}
                    onSave={(content, id) => handleSaveFavorite(content, 'post', id)}
                    isCopied={copied === 'posts'}
                    savingId={saving}
                  />

                  {/* Video Ideas */}
                  <ResultCard
                    title="أفكار الفيديوهات"
                    type="video"
                    icon={<Video className="w-5 h-5" />}
                    items={results.videoIdeas}
                    onCopy={(text) => copyToClipboard(text, 'videos')}
                    onSave={(content, id) => handleSaveFavorite(content, 'video', id)}
                    isCopied={copied === 'videos'}
                    savingId={saving}
                  />

                  {/* Captions */}
                  <ResultCard
                    title="التعليقات"
                    type="caption"
                    icon={<Send className="w-5 h-5" />}
                    items={results.captions}
                    onCopy={(text) => copyToClipboard(text, 'captions')}
                    onSave={(content, id) => handleSaveFavorite(content, 'caption', id)}
                    isCopied={copied === 'captions'}
                    savingId={saving}
                  />

                  {/* Hashtags */}
                  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-100">
                        <Hash className="w-5 h-5" />
                        <h3 className="font-bold">الوسوم</h3>
                      </div>
                      <button
                        onClick={() => copyToClipboard(results.hashtags.join(' '), 'hashtags')}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {copied === 'hashtags' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {results.hashtags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-xs text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advanced Features */}
                <div className="space-y-6">
                  {results.hook && (
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
                      <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-zinc-400" />
                        الخطاف (أول 3 ثوانٍ)
                      </h3>
                      <p className="text-zinc-400 italic leading-relaxed">"{results.hook}"</p>
                    </div>
                  )}

                  {results.script && (
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
                      <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                        <Video className="w-5 h-5 text-zinc-400" />
                        سيناريو الفيديو
                      </h3>
                      <pre className="text-zinc-400 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                        {results.script}
                      </pre>
                    </div>
                  )}

                  {results.calendar && (
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
                      <h3 className="text-zinc-100 font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-zinc-400" />
                        تقويم 7 أيام
                      </h3>
                      <p className="text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">
                        {results.calendar}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 space-y-4">
                <Sparkles className="w-12 h-12 opacity-20" />
                <p className="text-center max-w-xs">أدخل مجالك ونوع نشاطك لإنشاء استراتيجية محتوى مخصصة.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ title, type, icon, items, onCopy, onSave, isCopied, savingId }: any) => (
  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-zinc-100">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <button
        onClick={() => onCopy(items.join('\n'))}
        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
      >
        {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-500" />}
      </button>
    </div>
    <ul className="space-y-3">
      {items.map((item: string, i: number) => {
        const itemId = `${type}-${i}`;
        return (
          <li key={i} className="text-sm text-zinc-400 flex items-start gap-3 group">
            <span className="text-zinc-700 font-mono text-xs mt-1 shrink-0">0{i + 1}</span>
            <span className="flex-1">{item}</span>
              <button
                onClick={() => onSave(item, itemId)}
                className="p-1.5 hover:bg-zinc-800 rounded-md transition-all opacity-0 group-hover:opacity-100"
                title="حفظ في المفضلة"
              >
              {savingId === itemId ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Heart className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);
