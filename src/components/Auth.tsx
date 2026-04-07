import React from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile } from '../types';
import { LogIn, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  user: any;
  loading: boolean;
  onProfileUpdate: (profile: UserProfile | null) => void;
}

export const Auth: React.FC<AuthProps> = ({ user, loading, onProfileUpdate }) => {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          role: result.user.email === 'ahmed.morgan2009@gmail.com' ? 'admin' : 'user',
          preferences: { theme: 'dark' },
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newProfile);
        onProfileUpdate(newProfile);
      } else {
        onProfileUpdate(userDoc.data() as UserProfile);
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.code === 'auth/network-request-failed') {
        alert('خطأ في الشبكة: يرجى التحقق من اتصالك بالإنترنت والتأكد من عدم وجود مانع إعلانات يحظر Firebase Auth. إذا كنت تستخدم Brave أو Safari، فحاول تعطيل "حظر ملفات تعريف الارتباط للجهات الخارجية".');
      } else if (error.code === 'auth/popup-blocked') {
        alert('تم حظر النافذة المنبثقة: يرجى السماح بالنوافذ المنبثقة لهذا الموقع لتسجيل الدخول.');
      } else {
        alert(`فشل تسجيل الدخول: ${error.message}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onProfileUpdate(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) return <div className="animate-pulse text-zinc-500">جاري التحميل...</div>;

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-zinc-100">{user.displayName}</span>
            <span className="text-xs text-zinc-500">{user.role}</span>
          </div>
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-red-400"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignIn}
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 text-zinc-950 rounded-full font-semibold hover:bg-white transition-colors"
        >
          <LogIn className="w-4 h-4" />
          تسجيل الدخول باستخدام جوجل
        </motion.button>
      )}
    </div>
  );
};
