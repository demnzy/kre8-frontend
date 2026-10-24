export interface CurrentUser {
  id: number;
  email: string;
  display_name: string;
  avatar_url?: string;
  preferences?: UserPreferences;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
  primary_niche: string;
  sub_niche: string;
  sub_niches?: string[];
  search_keywords?: string;
  target_audience?: string;
  preferred_tone?: string;
  preferred_platforms?: string[];
  weekly_post_goal?: number;
}

export interface OnboardingSuggestions {
  topics: string[];
  audience_suggestions: string[];
  tones: { title: string; desc: string }[];
  suggested_platforms: string[];
}

export interface AIConnectionStatus {
  status: 'online' | 'missing_key' | 'error';
  connected: boolean;
  model: string;
  latency_ms: number;
  message: string;
  key_preview?: string;
}

export interface AIPromptTestResult {
  success: boolean;
  response: string;
  latency_ms: number;
  model: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    display_name: string;
  };
}

export interface UserPreferences {
  id: number;
  primary_niche: string;
  sub_niche: string;
  search_keywords?: string;
  target_audience?: string;
  preferred_tone?: string;
  preferred_platforms: string[];
  weekly_post_goal: number;
  gemini_api_key?: string;
  news_api_key?: string;
  youtube_client_id?: string;
  linkedin_client_id?: string;
  tiktok_client_key?: string;
  meta_app_id?: string;
}

export interface NewsAIIdea {
  id: number;
  topic_angle: string;
  why_it_matters?: string;
  recommended_format: string;
  viral_hooks: string[];
  talking_points: string[];
  is_saved_to_ideas: boolean;
}

export interface NewsArticle {
  id: number;
  niche: string;
  sub_niche: string;
  headline: string;
  summary?: string;
  source_name?: string;
  source_url: string;
  image_url?: string;
  published_date?: string;
  ai_ideas: NewsAIIdea[];
}

export interface ContentItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  platform: string;
  format: string;
  status: 'Idea' | 'Researching' | 'Script Writing' | 'Ready to Record' | 'Recorded' | 'Editing' | 'Ready to Publish' | 'Scheduled' | 'Published' | 'Repurposed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  planned_date?: string;
  published_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentIdea {
  id: number;
  title: string;
  description?: string;
  category: string;
  intended_platform: string;
  source_inspiration?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  status: 'Draft' | 'Active' | 'Converted' | 'Archived';
  is_favorite: boolean;
  notes?: string;
  created_at: string;
}

export interface ScriptClip {
  id?: number;
  clip_number: number;
  spoken_dialogue?: string;
  estimated_duration: number;
  on_screen_text?: string;
  visual_direction?: string;
  transition?: string;
  cta?: string;
}

export interface Script {
  id: number;
  content_item_id?: number;
  title: string;
  tone: string;
  target_duration_seconds: number;
  full_script?: string;
  generated_hooks: string[];
  generated_ctas: string[];
  clips: ScriptClip[];
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistItem {
  text: string;
  done: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  content_item_id?: number;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  is_completed: boolean;
  checklist: TaskChecklistItem[];
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  is_pinned: boolean;
  linked_type?: string;
  linked_id?: number;
  updated_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start_time: string;
  end_time?: string;
  content_item_id?: number;
  event_type: 'Draft' | 'Planned' | 'Scheduled' | 'Published';
  platform: string;
  notes?: string;
}

export interface Goal {
  id: number;
  title: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  is_achieved: boolean;
}

export interface CreatorWatchlist {
  id: number;
  creator_name: string;
  handle: string;
  platform: string;
  profile_url?: string;
  topic_niche?: string;
  personal_notes?: string;
  original_angles?: string;
}

export interface SocialAccount {
  id: number;
  platform: string;
  account_name: string;
  account_id?: string;
  avatar_url?: string;
  is_connected: boolean;
  last_synced_at?: string;
}

export interface SocialConnectPayload {
  account_name?: string;
  account_id?: string;
  avatar_url?: string;
  followers?: number;
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagement_rate?: number;
}

export interface YouTubeLookupResult {
  success: boolean;
  handle: string;
  channel_title: string;
  subscribers_text?: string;
  followers: number;
  avatar_url?: string;
  message?: string;
}

export interface AnalyticsSummary {
  total_followers: number;
  total_views: number;
  total_impressions: number;
  total_interactions: number;
  engagement_rate: number;
  connected_accounts_count: number;
  platforms: {
    platform: string;
    account_name: string;
    followers: number;
    views: number;
    engagement_rate: number;
  }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}
