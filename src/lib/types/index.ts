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
  provider?: string;
  model: string;
  latency_ms: number;
  message: string;
  key_preview?: string;
  is_fallback?: boolean;
  status_note?: string;
}

export interface AIPromptTestResult {
  success: boolean;
  response: string;
  latency_ms: number;
  model: string;
  provider?: string;
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
  ai_provider?: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter' | 'deepseek';
  ai_model?: string;
  gemini_api_key?: string;
  openai_api_key?: string;
  anthropic_api_key?: string;
  groq_api_key?: string;
  openrouter_api_key?: string;
  deepseek_api_key?: string;
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

export interface ScriptVersion {
  version: number;
  label: string;
  full_script: string;
  clips?: ScriptClip[];
  timestamp: string;
}

export interface ScriptRevisionMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  summary_of_changes?: string;
  version_number?: number;
}

export interface AIReviseScriptPayload {
  script_id?: number;
  current_script: string;
  current_clips?: ScriptClip[];
  instruction: string;
  conversation_history?: { role: string; content: string }[];
  target_duration_seconds?: number;
  tone?: string;
}

export interface AIReviseScriptResult {
  revised_script: string;
  revised_clips: ScriptClip[];
  summary_of_changes: string;
  assistant_message: string;
  version_number: number;
  used_provider: string;
  used_model: string;
  versions?: ScriptVersion[];
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
  versions?: ScriptVersion[];
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
  avatar_url?: string;
  subscriber_count_text?: string;
  pacing_style?: string;
  signature_hooks?: string[];
  personal_notes?: string;
  original_angles?: string;
}

export interface CreatorInspectResult {
  success: boolean;
  creator_name: string;
  handle: string;
  platform: string;
  profile_url: string;
  avatar_url?: string;
  subscriber_count_text?: string;
  topic_niche: string;
  personal_notes: string;
  original_angles: string;
  pacing_style: string;
  signature_hooks: string[];
  recent_titles: string[];
  error?: string;
}

export interface RecentUploadItem {
  video_id: string;
  title: string;
  published_at: string;
  thumbnail_url?: string;
  views: number;
  likes: number;
  engagement_rate?: number;
  url: string;
}

export interface SocialAccount {
  id: number;
  platform: string;
  account_name: string;
  account_id?: string;
  avatar_url?: string;
  channel_id?: string;
  custom_url?: string;
  total_videos_count?: number;
  raw_details?: Record<string, any>;
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
  total_videos?: number;
  recent_videos?: RecentUploadItem[];
  raw_data?: Record<string, any>;
  custom_url?: string;
  channel_id?: string;
}

export interface YouTubeLookupResult {
  success: boolean;
  platform?: string;
  handle: string;
  channel_title: string;
  channel_id?: string;
  avatar_url?: string;
  subscribers_text?: string;
  followers: number;
  total_videos?: number;
  total_tracked_views?: number;
  avg_views?: number;
  avg_engagement?: number;
  cadence_weekly?: number;
  top_video?: RecentUploadItem;
  recent_videos?: RecentUploadItem[];
  message?: string;
}

export interface PlatformChannelDetail {
  is_connected: boolean;
  platform: string;
  account_name: string;
  account_id?: string;
  avatar_url?: string;
  last_synced_at?: string;
  followers: number;
  views: number;
  impressions: number;
  engagement_rate: number;
  total_videos: number;
  avg_views: number;
  cadence_weekly: number;
  top_video?: RecentUploadItem;
  recent_videos: RecentUploadItem[];
  raw_data: Record<string, any>;
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
    avatar_url?: string;
    followers: number;
    views: number;
    impressions?: number;
    engagement_rate: number;
    total_videos?: number;
    avg_views?: number;
    cadence_weekly?: number;
    top_video?: RecentUploadItem;
  }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}
