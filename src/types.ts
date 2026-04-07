export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  preferences: {
    theme: 'light' | 'dark';
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

export type View = 'dashboard' | 'history' | 'profile' | 'admin';
