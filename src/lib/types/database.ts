// =============================================================
// Jobmatch — Database Types (matches Supabase schema exactly)
// =============================================================

export type UserRole = 'student' | 'store_manager' | 'school_admin' | 'super_admin';

export type EducationLine =
  | 'detail'
  | 'handel_salg'
  | 'handel_indkoeb'
  | 'handel_logistik'
  | 'spedition'
  | 'kontoradministration';

export type YouthEducationType = 'stx' | 'hhx' | 'htx' | 'hf' | 'eux' | 'eud' | 'other';

export type BehavioralStyle = 'analytical' | 'action_oriented' | 'social' | 'stabilizing';

export type SwipeDirection = 'left' | 'right';

export type MatchStatus = 'active' | 'archived' | 'reported';

// ----- Label maps for UI display -----

export const EDUCATION_LINE_LABELS: Record<EducationLine, string> = {
  detail: 'Detail',
  handel_salg: 'Handel & Salg',
  handel_indkoeb: 'Handel & Indkøb',
  handel_logistik: 'Handel & Logistik',
  spedition: 'Spedition',
  kontoradministration: 'Kontoradministration',
};

export const YOUTH_EDUCATION_LABELS: Record<YouthEducationType, string> = {
  stx: 'STX (Gymnasium)',
  hhx: 'HHX',
  htx: 'HTX',
  hf: 'HF',
  eux: 'EUX',
  eud: 'EUD',
  other: 'Anden',
};

export const BEHAVIORAL_STYLE_LABELS: Record<BehavioralStyle, string> = {
  analytical: 'Analytisk',
  action_oriented: 'Handlingsorienteret',
  social: 'Social',
  stabilizing: 'Stabiliserende',
};

export const BEHAVIORAL_STYLE_ICONS: Record<BehavioralStyle, string> = {
  analytical: '🔬',
  action_oriented: '⚡',
  social: '🤝',
  stabilizing: '🛡️',
};

export const BEHAVIORAL_STYLE_COLORS: Record<BehavioralStyle, string> = {
  analytical: '#3B82F6',   // blue
  action_oriented: '#F97316', // orange
  social: '#10B981',       // green
  stabilizing: '#8B5CF6',  // purple
};

// ----- Database row types -----

export interface Organization {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreChain {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  admin_user_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  organization_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  education_line: EducationLine | null;
  youth_education: YouthEducationType | null;
  youth_education_school: string | null;
  work_experience: string | null;
  primary_style: BehavioralStyle | null;
  secondary_style: BehavioralStyle | null;
  video_pitch_url: string | null;
  video_thumbnail_url: string | null;
  cv_url: string | null;
  gdpr_consent: boolean;
  location: unknown | null; // PostGIS geography point
  notify_push: boolean;
  notify_email: boolean;
  notify_in_app: boolean;
  onboarding_completed: boolean;
  is_active: boolean;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  manager_id: string;
  organization_id: string | null;
  chain_id: string | null;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string;
  location: unknown; // PostGIS geography point
  education_lines: EducationLine[];
  internship_slots: number;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  chain?: StoreChain | null;
  distance_km?: number;
}

export interface Swipe {
  id: string;
  profile_id: string;
  store_id: string;
  swiper_role: UserRole;
  direction: SwipeDirection;
  created_at: string;
}

export interface Match {
  id: string;
  student_id: string;
  store_id: string;
  student_swipe_id: string;
  store_swipe_id: string;
  status: MatchStatus;
  matched_at: string;
  // Joined fields (optional)
  store?: Store;
  student?: Profile;
}

// ----- KPI types -----

export interface KpiSwipeStats {
  education_line: EducationLine;
  total_students: number;
  total_swipes: number;
  right_swipes: number;
  left_swipes: number;
  total_matches: number;
  match_rate: number;
}

export interface AtRiskStudent {
  student_id: string;
  full_name: string | null;
  education_line: EducationLine;
  youth_education: YouthEducationType;
  total_swipes: number;
  right_swipes: number;
  match_count: number;
  gdpr_consent: boolean;
  last_active_at: string | null;
}

export interface DashboardOverview {
  total_students: number;
  active_students: number;
  total_stores: number;
  total_swipes: number;
  total_matches: number;
  overall_match_rate: number;
  students_with_gdpr: number;
}
