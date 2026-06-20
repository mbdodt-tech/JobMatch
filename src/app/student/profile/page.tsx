'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, GraduationCap, Briefcase, Shield, Edit3, Save, X,
  Heart, ArrowLeftRight, Eye, Camera, ToggleLeft, ToggleRight,
  FileText, Upload, Loader2, ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';
import {
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_ICONS,
  BEHAVIORAL_STYLE_COLORS,
  EDUCATION_LINE_LABELS,
  YOUTH_EDUCATION_LABELS,
} from '@/lib/types/database';

export default function StudentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ swipes: 0, matches: 0 });
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [uploading, setUploading] = useState<'avatar' | 'video' | 'cv' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) {
        setProfile(p as Profile);
        setFormData(p);
      }

      const { count: swipeCount } = await supabase
        .from('swipes').select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id).eq('swiper_role', 'student');

      const { count: matchCount } = await supabase
        .from('matches').select('*', { count: 'exact', head: true })
        .eq('student_id', user.id).eq('status', 'active');

      setStats({ swipes: swipeCount || 0, matches: matchCount || 0 });
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: formData.full_name,
      phone: formData.phone,
      work_experience: formData.work_experience,
      gdpr_consent: formData.gdpr_consent,
    }).eq('id', profile.id);
    setProfile({ ...profile, ...formData } as Profile);
    setEditing(false);
    setSaving(false);
  };

  const handleUpload = async (
    file: File,
    kind: 'avatar' | 'video' | 'cv'
  ) => {
    if (!profile) return;
    setUploadError('');
    setUploading(kind);
    try {
      const folder = kind === 'avatar' ? 'avatars' : kind === 'video' ? 'videos' : 'cvs';
      const baseName = kind === 'avatar' ? 'avatar' : kind === 'video' ? 'pitch' : 'cv';
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${folder}/${profile.id}/${baseName}.${ext}`;

      const { error } = await supabase.storage
        .from('student-media')
        .upload(path, file, { upsert: true });
      if (error) {
        setUploadError(`Upload fejlede: ${error.message}`);
        return;
      }

      const { data } = supabase.storage.from('student-media').getPublicUrl(path);
      // Cache-bust so a replaced file shows immediately
      const url = `${data.publicUrl}?t=${Date.now()}`;

      const column = kind === 'avatar' ? 'avatar_url' : kind === 'video' ? 'video_pitch_url' : 'cv_url';
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ [column]: url })
        .eq('id', profile.id);
      if (dbError) {
        setUploadError(`Kunne ikke gemme: ${dbError.message}`);
        return;
      }

      setProfile({ ...profile, [column]: url } as Profile);
      setFormData({ ...formData, [column]: url });
    } finally {
      setUploading(null);
    }
  };

  const toggleGdpr = async () => {
    if (!profile) return;
    const newVal = !profile.gdpr_consent;
    await supabase.from('profiles').update({ gdpr_consent: newVal }).eq('id', profile.id);
    setProfile({ ...profile, gdpr_consent: newVal });
    setFormData({ ...formData, gdpr_consent: newVal });
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <User size={32} className="text-purple-400" />
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;
  const age = calculateAge(profile.date_of_birth);

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-32">
      {/* Gradient Header */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-blue-600/30 to-cyan-500/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-0.5">
              <div className="w-full h-full rounded-full bg-[#12121A] flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl">{profile.full_name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading !== null}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-500 border-2 border-[#0A0A0F] flex items-center justify-center disabled:opacity-50"
              title="Skift profilbillede"
            >
              {uploading === 'avatar' ? (
                <Loader2 size={14} className="text-white animate-spin" />
              ) : (
                <Camera size={14} className="text-white" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f, 'avatar');
                e.target.value = '';
              }}
            />
          </div>
        </motion.div>

        {/* Name & Info */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#F8FAFC]">{profile.full_name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1 text-sm text-[#94A3B8]">
            {age && <span>{age} år</span>}
            {profile.education_line && (
              <>
                <span className="text-[#64748B]">·</span>
                <span>{EDUCATION_LINE_LABELS[profile.education_line]}</span>
              </>
            )}
          </div>
          {profile.youth_education && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-[#64748B]">
              <GraduationCap size={12} />
              <span>{YOUTH_EDUCATION_LABELS[profile.youth_education]}</span>
              {profile.youth_education_school && <span>— {profile.youth_education_school}</span>}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Swipes', value: stats.swipes, icon: ArrowLeftRight, color: 'text-blue-400' },
            { label: 'Matches', value: stats.matches, icon: Heart, color: 'text-green-400' },
            { label: 'Profil', value: profile.onboarding_completed ? '100%' : '50%', icon: Eye, color: 'text-purple-400' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.03 }}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"
            >
              <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
              <div className="text-lg font-bold text-[#F8FAFC]">{stat.value}</div>
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Behavioral Styles */}
        {(profile.primary_style || profile.secondary_style) && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
              Adfærdsstile
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.primary_style && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: `${BEHAVIORAL_STYLE_COLORS[profile.primary_style]}15`,
                    borderColor: `${BEHAVIORAL_STYLE_COLORS[profile.primary_style]}40`,
                  }}
                >
                  <span>{BEHAVIORAL_STYLE_ICONS[profile.primary_style]}</span>
                  <span className="text-xs font-medium text-[#F8FAFC]">
                    {BEHAVIORAL_STYLE_LABELS[profile.primary_style]}
                  </span>
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-[#94A3B8]">Primær</span>
                </motion.div>
              )}
              {profile.secondary_style && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: `${BEHAVIORAL_STYLE_COLORS[profile.secondary_style]}10`,
                    borderColor: `${BEHAVIORAL_STYLE_COLORS[profile.secondary_style]}30`,
                  }}
                >
                  <span>{BEHAVIORAL_STYLE_ICONS[profile.secondary_style]}</span>
                  <span className="text-xs font-medium text-[#F8FAFC]">
                    {BEHAVIORAL_STYLE_LABELS[profile.secondary_style]}
                  </span>
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-[#94A3B8]">Sekundær</span>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Work Experience */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={14} className="text-[#64748B]" />
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Joberfaring</h3>
          </div>
          {editing ? (
            <textarea
              value={formData.work_experience || ''}
              onChange={(e) => setFormData({ ...formData, work_experience: e.target.value })}
              rows={3}
              className="w-full text-sm"
              placeholder="Beskriv din joberfaring..."
            />
          ) : (
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              {profile.work_experience || 'Ingen joberfaring tilføjet endnu'}
            </p>
          )}
        </div>

        {/* GDPR Toggle */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-[#F8FAFC]">GDPR-samtykke</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Tillad at erhvervscentret kan se din aktivitet og støtte din søgning
              </p>
            </div>
            <button onClick={toggleGdpr} className="ml-3 shrink-0">
              {profile.gdpr_consent ? (
                <ToggleRight size={36} className="text-green-400" />
              ) : (
                <ToggleLeft size={36} className="text-[#64748B]" />
              )}
            </button>
          </div>
        </div>

        {/* CV Upload */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-[#64748B]" />
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">CV</h3>
          </div>
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, 'cv');
              e.target.value = '';
            }}
          />
          {profile.cv_url ? (
            <div className="flex items-center gap-3">
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-2 py-2.5 px-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
              >
                <FileText size={16} /> Se mit CV <ExternalLink size={12} className="ml-auto" />
              </a>
              <button
                onClick={() => cvInputRef.current?.click()}
                disabled={uploading !== null}
                className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading === 'cv' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Skift
              </button>
            </div>
          ) : (
            <button
              onClick={() => cvInputRef.current?.click()}
              disabled={uploading !== null}
              className="w-full py-6 rounded-xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors disabled:opacity-50"
            >
              {uploading === 'cv' ? (
                <Loader2 size={24} className="text-purple-400 animate-spin" />
              ) : (
                <Upload size={24} className="text-[#64748B]" />
              )}
              <p className="text-xs text-[#94A3B8] font-medium">
                {uploading === 'cv' ? 'Uploader…' : 'Upload dit CV (PDF eller Word)'}
              </p>
            </button>
          )}
        </div>

        {/* Video Pitch */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Camera size={14} className="text-[#64748B]" />
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Video-pitch</h3>
            </div>
            {profile.video_pitch_url && (
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading !== null}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {uploading === 'video' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Skift video
              </button>
            )}
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, 'video');
              e.target.value = '';
            }}
          />
          {profile.video_pitch_url ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50">
              <video src={profile.video_pitch_url} className="w-full h-full object-cover" controls />
            </div>
          ) : (
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading !== null}
              className="w-full aspect-video rounded-xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors disabled:opacity-50"
            >
              {uploading === 'video' ? (
                <Loader2 size={24} className="text-purple-400 animate-spin" />
              ) : (
                <Camera size={24} className="text-[#64748B]" />
              )}
              <p className="text-xs text-[#94A3B8] font-medium">
                {uploading === 'video' ? 'Uploader…' : 'Upload en video-pitch (MP4, MOV)'}
              </p>
            </button>
          )}
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            {uploadError}
          </div>
        )}

        {/* Edit / Save */}
        <div className="flex gap-3">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setFormData(profile); }}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] font-medium text-sm flex items-center justify-center gap-2"
              >
                <X size={16} /> Annuller
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Save size={16} /> {saving ? 'Gemmer…' : 'Gem'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[#F8FAFC] font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Edit3 size={16} /> Rediger profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
