export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  preferences: {
    theme: 'light' | 'dark' | 'emerald' | 'rose' | 'amber' | 'blue';
    niche?: string;
  };
  createdAt: any;
}

export interface CalendarDay {
  day: number;
  topic: string;
  platform: string;
  format: string;
}

export interface ContentResults {
  postIdeas: string[];
  videoIdeas: string[];
  captions: string[];
  hashtags: string[];
  score: number;
  script?: string;
  hook?: string;
  calendar?: CalendarDay[];
}

export interface ContentGeneration {
  id: string;
  userId: string;
  niche: string;
  activityType: string;
  targetAudience?: string;
  tone?: string;
  duration?: number;
  results: ContentResults;
  createdAt: any;
}

export interface Favorite {
  id: string;
  userId: string;
  type: 'post' | 'video' | 'caption';
  content: string;
  niche: string;
  createdAt: any;
}

export interface ScheduledPost {
  id: string;
  userId: string;
  content: string;
  platform: string;
  scheduledAt: any;
  status: 'pending' | 'published' | 'failed';
  createdAt: any;
}

export interface ABTest {
  id: string;
  userId: string;
  niche: string;
  variationA: {
    content: string;
    likes: number;
    comments: number;
    shares: number;
  };
  variationB: {
    content: string;
    likes: number;
    comments: number;
    shares: number;
  };
  status: 'active' | 'completed';
  createdAt: any;
}

export type View = 'dashboard' | 'history' | 'profile' | 'admin' | 'schedule';
