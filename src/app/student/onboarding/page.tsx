'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, GraduationCap, Brain, Video,
  ChevronLeft, ChevronRight, Rocket,
  Calendar, Phone, Upload, Camera, Shield,
} from 'lucide-react';
import {
  type EducationLine,
  type YouthEducationType,
  type BehavioralStyle,
  EDUCATION_LINE_LABELS,
  YOUTH_EDUCATION_LABELS,
  BEHAVIORAL_STYLE_LABELS,
  BEHAVIORAL_STYLE_ICONS,
  BEHAVIORAL_STYLE_COLORS,
} from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';

// ─── Constants ───────────────────────────────────────────────────────
const STEPS = [
  { icon: '👤', label: 'Personlig info' },
  { icon: '🎓', label: 'Uddannelse' },
  { icon: '🧠', label: 'Adfærdsstil' },
  { icon: '🎬', label: 'Video & GDPR' },
];

const BEHAVIORAL_STYLES: BehavioralStyle[] = [
  'analytical',
  'action_oriented',
  'social',
  'stabilizing',
];

const STYLE_DESCRIPTIONS: Record<BehavioralStyle, string> = {
  analytical: 'Du går i dybden, stiller spørgsmål og elsker data og detaljer.',
  action_oriented: 'Du handler hurtigt, tager initiativ og elsker resultater.',
  social: 'Du er empatisk, samarbejder og bygger relationer naturligt.',
  stabilizing: 'Du er pålidelig, tålmodig og skaber tryghed for andre.',
};

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ─── Form state ──────────────────────────────────────────────────────
interface FormData {
  full_name: string;
  date_of_birth: string;
  phone: string;
  youth_education: YouthEducationType | '';
  youth_education_school: string;
  education_line: EducationLine | '';
  primary_style: BehavioralStyle | null;
  secondary_style: BehavioralStyle | null;
  video_file: File | null;
  cv_file: File | null;
  gdpr_consent: boolean;
}

export default function StudentOnboarding() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    full_name: '',
    date_of_birth: '',
    phone: '',
    youth_education: '',
    youth_education_school: '',
    education_line: '',
    primary_style: null,
    secondary_style: null,
    video_file: null,
    cv_file: null,
    gdpr_consent: false,
  });

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const goNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };
  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Upload video if present
      let video_pitch_url: string | null = null;
      if (form.video_file) {
        const ext = form.video_file.name.split('.').pop();
        const path = `videos/${user.id}/pitch.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('student-media')
          .upload(path, form.video_file, { upsert: true });
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('student-media').getPublicUrl(path);
          video_pitch_url = publicUrl;
        }
      }

      // Upload CV if present
      let cv_url: string | null = null;
      if (form.cv_file) {
        const ext = form.cv_file.name.split('.').pop();
        const path = `cvs/${user.id}/cv.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('student-media')
          .upload(path, form.cv_file, { upsert: true });
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('student-media').getPublicUrl(path);
          cv_url = publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          date_of_birth: form.date_of_birth || null,
          phone: form.phone || null,
          youth_education: form.youth_education || null,
          youth_education_school: form.youth_education_school || null,
          education_line: form.education_line || null,
          primary_style: form.primary_style,
          secondary_style: form.secondary_style,
          video_pitch_url,
          cv_url,
          gdpr_consent: form.gdpr_consent,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (!error) {
        window.location.href = '/student/feed';
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#0A0A0F]/80 px-4 pt-4 pb-2">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                    i <= step
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                      : 'bg-white/10'
                  }`}
                  animate={
                    i === step
                      ? { boxShadow: ['0 0 8px rgba(124,58,237,0.4)', '0 0 16px rgba(124,58,237,0.6)', '0 0 8px rgba(124,58,237,0.4)'] }
                      : { boxShadow: '0 0 0px transparent' }
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className={`text-[10px] font-medium ${i <= step ? 'text-purple-400' : 'text-[#64748B]'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="px-4 py-6 max-w-md mx-auto w-full"
          >
            {step === 0 && <StepPersonalInfo form={form} update={update} />}
            {step === 1 && <StepEducation form={form} update={update} />}
            {step === 2 && <StepBehavioralStyle form={form} update={update} />}
            {step === 3 && <StepVideoGdpr form={form} update={update} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 z-40 backdrop-blur-xl bg-[#0A0A0F]/80 border-t border-white/5 px-4 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-[#94A3B8] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ChevronLeft size={18} />
              Tilbage
            </button>
          )}

          <button
            onClick={step === 3 ? handleSubmit : goNext}
            disabled={loading}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : step === 3 ? (
              <>
                Kom i gang! 🚀
              </>
            ) : (
              <>
                Næste
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Step 1 — Personal Info
// ═══════════════════════════════════════════════════════════════════
function StepPersonalInfo({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-3"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          👤
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Fortæl os om dig selv
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Grundlæggende oplysninger til din profil
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <User size={14} /> Fulde navn
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            placeholder="Fx Anders Jensen"
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all text-base"
          />
        </div>

        {/* Date of birth */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <Calendar size={14} /> Fødselsdato
          </label>
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => update('date_of_birth', e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all text-base [color-scheme:dark]"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <Phone size={14} /> Telefonnummer
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+45 12 34 56 78"
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all text-base"
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Step 2 — Education
// ═══════════════════════════════════════════════════════════════════
function StepEducation({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-3"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎓
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Din uddannelse
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Hvilken uddannelse tager du?
        </p>
      </div>

      <div className="space-y-4">
        {/* Youth education type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#94A3B8]">
            Ungdomsuddannelse
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(YOUTH_EDUCATION_LABELS) as YouthEducationType[]).map(
              (key) => (
                <button
                  key={key}
                  onClick={() => update('youth_education', key)}
                  className={`py-3 px-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                    form.youth_education === key
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 border shadow-md shadow-purple-500/10'
                      : 'bg-white/5 border border-white/10 text-[#94A3B8] hover:bg-white/10'
                  }`}
                >
                  {YOUTH_EDUCATION_LABELS[key]}
                </button>
              ),
            )}
          </div>
        </div>

        {/* School name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <GraduationCap size={14} /> Skolens navn
          </label>
          <input
            type="text"
            value={form.youth_education_school}
            onChange={(e) => update('youth_education_school', e.target.value)}
            placeholder="Fx Niels Brock"
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all text-base"
          />
        </div>

        {/* Education line */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#94A3B8]">
            Uddannelsesretning
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(EDUCATION_LINE_LABELS) as EducationLine[]).map(
              (key) => (
                <button
                  key={key}
                  onClick={() => update('education_line', key)}
                  className={`py-3 px-3 rounded-xl text-sm font-medium transition-all text-left active:scale-[0.97] ${
                    form.education_line === key
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 border shadow-md shadow-blue-500/10'
                      : 'bg-white/5 border border-white/10 text-[#94A3B8] hover:bg-white/10'
                  }`}
                >
                  {EDUCATION_LINE_LABELS[key]}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Step 3 — Behavioral Style
// ═══════════════════════════════════════════════════════════════════
function StepBehavioralStyle({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const handleSelect = (style: BehavioralStyle) => {
    if (form.primary_style === style) {
      // Deselect primary
      update('primary_style', form.secondary_style);
      update('secondary_style', null);
    } else if (form.secondary_style === style) {
      // Deselect secondary
      update('secondary_style', null);
    } else if (!form.primary_style) {
      update('primary_style', style);
    } else if (!form.secondary_style) {
      update('secondary_style', style);
    } else {
      // Replace secondary
      update('secondary_style', style);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-3"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🧠
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Din adfærdsstil
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Vælg en primær og en sekundær stil
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {BEHAVIORAL_STYLES.map((style) => {
          const isPrimary = form.primary_style === style;
          const isSecondary = form.secondary_style === style;
          const isSelected = isPrimary || isSecondary;
          const color = BEHAVIORAL_STYLE_COLORS[style];

          return (
            <motion.button
              key={style}
              onClick={() => handleSelect(style)}
              whileTap={{ scale: 0.97 }}
              className={`relative p-5 rounded-2xl text-left transition-all ${
                isSelected
                  ? 'border-2 bg-white/[0.07]'
                  : 'border border-white/10 bg-white/5 hover:bg-white/[0.07]'
              }`}
              style={{
                borderColor: isSelected ? color : undefined,
                boxShadow: isPrimary ? `0 0 30px ${color}33, 0 0 60px ${color}15` : undefined,
              }}
              animate={
                isPrimary
                  ? { boxShadow: [`0 0 20px ${color}33`, `0 0 40px ${color}44`, `0 0 20px ${color}33`] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="text-4xl flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {BEHAVIORAL_STYLE_ICONS[style]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#F8FAFC]">
                      {BEHAVIORAL_STYLE_LABELS[style]}
                    </h3>
                    {isPrimary && (
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${color}30`,
                          color,
                        }}
                      >
                        Primær
                      </span>
                    )}
                    {isSecondary && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#94A3B8]">
                        Sekundær
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">
                    {STYLE_DESCRIPTIONS[style]}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!form.primary_style && (
        <p className="text-center text-xs text-[#64748B]">
          Tryk på et kort for at vælge din primære stil
        </p>
      )}
      {form.primary_style && !form.secondary_style && (
        <p className="text-center text-xs text-[#64748B]">
          Vælg nu din sekundære stil
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Step 4 — Video Pitch & GDPR
// ═══════════════════════════════════════════════════════════════════
function StepVideoGdpr({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [cvDragOver, setCvDragOver] = useState(false);

  const handleFile = (files: FileList | null) => {
    if (files?.[0]) {
      update('video_file', files[0]);
    }
  };

  const handleCvFile = (files: FileList | null) => {
    if (files?.[0]) {
      update('cv_file', files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-3"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎬
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Video, CV & Samtykke
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Upload en kort videopitch, dit CV og accepter GDPR
        </p>
      </div>

      {/* Video upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? 'border-purple-500 bg-purple-500/10'
            : form.video_file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-white/15 bg-white/5 hover:border-white/25'
        }`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={(e) => handleFile(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {form.video_file ? (
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-sm font-medium text-green-400">
              {form.video_file.name}
            </p>
            <p className="text-xs text-[#64748B]">
              {(form.video_file.size / 1024 / 1024).toFixed(1)} MB — Tryk for at ændre
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Upload size={24} className="text-[#64748B]" />
              <Camera size={24} className="text-[#64748B]" />
            </div>
            <p className="text-sm text-[#94A3B8] font-medium">
              Træk en video hertil eller tryk for at uploade
            </p>
            <p className="text-xs text-[#64748B]">
              MP4, MOV — maks 2 minutter anbefalet
            </p>
          </div>
        )}
      </div>

      {/* CV upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setCvDragOver(true);
        }}
        onDragLeave={() => setCvDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setCvDragOver(false);
          handleCvFile(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          cvDragOver
            ? 'border-purple-500 bg-purple-500/10'
            : form.cv_file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-white/15 bg-white/5 hover:border-white/25'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => handleCvFile(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {form.cv_file ? (
          <div className="space-y-2">
            <div className="text-3xl">📄</div>
            <p className="text-sm font-medium text-green-400">
              {form.cv_file.name}
            </p>
            <p className="text-xs text-[#64748B]">
              {(form.cv_file.size / 1024 / 1024).toFixed(1)} MB — Tryk for at ændre
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={24} className="text-[#64748B] mx-auto" />
            <p className="text-sm text-[#94A3B8] font-medium">
              Upload dit CV (valgfrit)
            </p>
            <p className="text-xs text-[#64748B]">
              PDF eller Word
            </p>
          </div>
        )}
      </div>

      {/* GDPR */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-[#F8FAFC] text-sm">
              Samtykke til deling af data (GDPR)
            </h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              Ved at aktivere giver du samtykke til, at dine profiloplysninger
              (navn, uddannelse, adfærdsstil og videopitch) kan deles med
              praktikvirksomheder, som du matcher med. Du kan til enhver tid
              trække dit samtykke tilbage under Indstillinger. Dine data
              behandles i henhold til GDPR og opbevares sikkert.
            </p>
          </div>
        </div>

        <button
          onClick={() => update('gdpr_consent', !form.gdpr_consent)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 transition-all"
        >
          <span className="text-sm font-medium text-[#F8FAFC]">
            Jeg giver mit samtykke
          </span>
          <div
            className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
              form.gdpr_consent ? 'bg-purple-500' : 'bg-white/15'
            }`}
          >
            <motion.div
              className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-md"
              animate={{ x: form.gdpr_consent ? 22 : 3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
