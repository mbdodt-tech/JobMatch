'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, GraduationCap,
  ChevronLeft, ChevronRight,
  Calendar, Phone, Upload, Camera, Shield,
  MapPin, Briefcase, Check, RotateCcw, X, Search, AlertCircle,
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
import DANISH_POSTAL_CODES from '@/lib/data/danish-postal-codes';
import DANISH_SCHOOLS from '@/lib/data/danish-schools';

// ─── Constants ───────────────────────────────────────────────────────
const STEPS = [
  { icon: '👤', label: 'Personlig info' },
  { icon: '🎓', label: 'Uddannelse' },
  { icon: '🧠', label: 'Adfærdsstil' },
  { icon: '🎬', label: 'Video & GDPR' },
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
  address: string;
  postal_code: string;
  city: string;
  youth_education: YouthEducationType | '';
  youth_education_school: string;
  education_line: EducationLine | '';
  work_experience: string;
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
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState<FormData>({
    full_name: '',
    date_of_birth: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    youth_education: '',
    youth_education_school: '',
    education_line: '',
    work_experience: '',
    primary_style: null,
    secondary_style: null,
    video_file: null,
    cv_file: null,
    gdpr_consent: false,
  });

  useEffect(() => {
    async function prefill() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, address, postal_code, city, date_of_birth')
        .eq('id', user.id)
        .single();

      setForm((prev) => ({
        ...prev,
        full_name: profile?.full_name || user.user_metadata?.full_name || prev.full_name,
        phone: profile?.phone || prev.phone,
        address: profile?.address || prev.address,
        postal_code: profile?.postal_code || prev.postal_code,
        city: profile?.city || prev.city,
        date_of_birth: profile?.date_of_birth || prev.date_of_birth,
      }));
    }
    prefill();
  }, []);

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
    setSubmitError('');

    if (!form.gdpr_consent) {
      setSubmitError('Du skal acceptere GDPR-samtykket for at fortsætte.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError('Du er ikke logget ind. Prøv at logge ind igen.');
        return;
      }

      // CV and video are sensitive student data — stored in private buckets;
      // only the object path is persisted and served later via signed URLs.
      let video_pitch_url: string | null = null;
      if (form.video_file) {
        const ext = form.video_file.name.split('.').pop();
        const path = `${user.id}/pitch.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('video-pitches')
          .upload(path, form.video_file, { upsert: true });
        if (uploadError) {
          setSubmitError(`Kunne ikke uploade video: ${uploadError.message}`);
          return;
        }
        video_pitch_url = path;
      }

      let cv_url: string | null = null;
      if (form.cv_file) {
        const ext = form.cv_file.name.split('.').pop();
        const path = `${user.id}/cv.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('student-docs')
          .upload(path, form.cv_file, { upsert: true });
        if (uploadError) {
          setSubmitError(`Kunne ikke uploade CV: ${uploadError.message}`);
          return;
        }
        cv_url = path;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          date_of_birth: form.date_of_birth || null,
          phone: form.phone || null,
          address: form.address || null,
          postal_code: form.postal_code || null,
          city: form.city || null,
          youth_education: form.youth_education || null,
          youth_education_school: form.youth_education_school || null,
          education_line: form.education_line || null,
          work_experience: form.work_experience || null,
          primary_style: form.primary_style,
          secondary_style: form.secondary_style,
          video_pitch_url,
          cv_url,
          gdpr_consent: form.gdpr_consent,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        setSubmitError(`Kunne ikke gemme profil: ${error.message}`);
        return;
      }

      window.location.href = '/student/feed';
    } catch (err) {
      setSubmitError('Der opstod en uventet fejl. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh aurora-bg aurora-bg-subtle flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#05050A]/80 border-b border-white/5 px-4 pt-4 pb-2 safe-top">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                    i <= step
                      ? 'bg-gradient-to-r from-violet-500 to-blue-500 animate-gradient'
                      : 'bg-white/10'
                  }`}
                  animate={
                    i === step
                      ? { boxShadow: ['0 0 8px rgba(139,92,246,0.4)', '0 0 16px rgba(139,92,246,0.6)', '0 0 8px rgba(139,92,246,0.4)'] }
                      : { boxShadow: '0 0 0px transparent' }
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className={`text-[10px] font-medium ${i <= step ? 'text-violet-400' : 'text-[#94A3B8]'}`}>
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
            {step === 2 && <StepDiscQuiz form={form} update={update} />}
            {step === 3 && <StepVideoGdpr form={form} update={update} error={submitError} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 z-40 backdrop-blur-xl bg-[#05050A]/80 border-t border-white/5 px-4 py-4 safe-bottom">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex-1 py-4 rounded-2xl glass text-[#94A3B8] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ChevronLeft size={18} />
              Tilbage
            </button>
          )}

          <button
            onClick={step === 3 ? handleSubmit : goNext}
            disabled={loading || (step === 2 && (!form.primary_style || !form.secondary_style))}
            className="flex-1 py-4 rounded-2xl btn-gradient text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
  const handlePostalCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    update('postal_code', digits);
    if (digits.length === 4 && DANISH_POSTAL_CODES[digits]) {
      update('city', DANISH_POSTAL_CODES[digits]);
    } else if (digits.length < 4) {
      update('city', '');
    }
  };

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
          Fortæl os om <span className="gradient-text">dig selv</span>
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Grundlæggende oplysninger til din profil
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="onboarding-full-name" className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <User size={14} /> Fulde navn
          </label>
          <input
            id="onboarding-full-name"
            type="text"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            placeholder="Fx Anders Jensen"
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base"
          />
        </div>

        {/* Date of birth */}
        <div className="space-y-1.5">
          <label htmlFor="onboarding-date-of-birth" className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <Calendar size={14} /> Fødselsdato
          </label>
          <input
            id="onboarding-date-of-birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => update('date_of_birth', e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base [color-scheme:dark]"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="onboarding-phone" className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <Phone size={14} /> Telefonnummer
          </label>
          <input
            id="onboarding-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+45 12 34 56 78"
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base"
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label htmlFor="onboarding-address" className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <MapPin size={14} /> Adresse
          </label>
          <input
            id="onboarding-address"
            type="text"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Fx Vesterbrogade 12, 2. th"
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base"
          />
        </div>

        {/* Postal code + city */}
        <div className="grid grid-cols-[1fr_1.6fr] gap-3">
          <div className="space-y-1.5">
            <label htmlFor="onboarding-postal-code" className="text-sm font-medium text-[#94A3B8]">Postnr.</label>
            <input
              id="onboarding-postal-code"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={form.postal_code}
              onChange={(e) => handlePostalCode(e.target.value)}
              placeholder="1620"
              className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="onboarding-city" className="text-sm font-medium text-[#94A3B8]">By</label>
            <input
              id="onboarding-city"
              type="text"
              value={form.city}
              readOnly={form.postal_code.length === 4 && !!DANISH_POSTAL_CODES[form.postal_code]}
              onChange={(e) => update('city', e.target.value)}
              placeholder="Udfyldes automatisk"
              className={`w-full px-4 py-3.5 rounded-2xl border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base ${
                form.postal_code.length === 4 && DANISH_POSTAL_CODES[form.postal_code]
                  ? 'bg-violet-500/10 border-violet-500/20'
                  : 'bg-white/5'
              }`}
            />
          </div>
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
  const [schoolSearch, setSchoolSearch] = useState(form.youth_education_school);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = schoolSearch.toLowerCase();
  const filteredSchools = q
    ? DANISH_SCHOOLS.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q),
      ).slice(0, 8)
    : DANISH_SCHOOLS.slice(0, 8);

  const handleSchoolSelect = (name: string) => {
    setSchoolSearch(name);
    update('youth_education_school', name);
    setShowDropdown(false);
  };

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
          Din <span className="gradient-text">uddannelse</span>
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
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 border shadow-md shadow-violet-500/10'
                      : 'bg-white/5 border border-white/10 text-[#94A3B8] hover:bg-white/10'
                  }`}
                >
                  {YOUTH_EDUCATION_LABELS[key]}
                </button>
              ),
            )}
          </div>
        </div>

        {/* School name — searchable dropdown */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <label htmlFor="onboarding-school" className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <GraduationCap size={14} /> Skole
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              id="onboarding-school"
              type="text"
              value={schoolSearch}
              onChange={(e) => {
                setSchoolSearch(e.target.value);
                update('youth_education_school', e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Søg efter din skole..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base"
            />
            {schoolSearch && (
              <button
                onClick={() => {
                  setSchoolSearch('');
                  update('youth_education_school', '');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <AnimatePresence>
            {showDropdown && filteredSchools.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-[#12121E] border border-white/10 shadow-xl overflow-hidden max-h-60 overflow-y-auto"
              >
                {filteredSchools.map((school) => (
                  <button
                    key={school.name}
                    onClick={() => handleSchoolSelect(school.name)}
                    className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${
                      form.youth_education_school === school.name ? 'bg-violet-500/15' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm text-[#F8FAFC]">{school.name}</p>
                      <p className="text-xs text-[#94A3B8]">{school.city}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      school.type === 'erhvervsskole'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-violet-500/15 text-violet-400'
                    }`}>
                      {school.type === 'erhvervsskole' ? 'Erhvervsskole' : 'Gymnasium'}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Work experience */}
        <div className="space-y-1.5">
          <label htmlFor="onboarding-work-experience" className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
            <Briefcase size={14} /> Erhvervserfaring
          </label>
          <textarea
            id="onboarding-work-experience"
            value={form.work_experience}
            onChange={(e) => update('work_experience', e.target.value)}
            placeholder="Fortæl kort om dine job, praktik eller frivilligt arbejde — fx 'Deltidsjob i Netto i 1 år, kundeservice og varepåfyldning.'"
            rows={4}
            className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all text-base resize-none"
          />
          <p className="text-xs text-[#94A3B8]">
            Ingen erfaring endnu? Det er helt fint — skriv blot hvad du brænder for.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Step 3 — DiSC-style questionnaire
// ═══════════════════════════════════════════════════════════════════
interface DiscQuestion {
  prompt: string;
  options: { style: BehavioralStyle; label: string }[];
}

// Each option maps to one of the four styles (DiSC: D=handling, i=social,
// S=stabiliserende, C=analytisk). The order of options is varied between
// questions to reduce position bias.
const DISC_QUESTIONS: DiscQuestion[] = [
  {
    prompt: 'I en gruppeopgave er jeg typisk den, der …',
    options: [
      { style: 'action_oriented', label: 'tager føringen og sætter retningen' },
      { style: 'social', label: 'sørger for, at alle trives og bidrager' },
      { style: 'analytical', label: 'styr på detaljerne og research’er' },
      { style: 'stabilizing', label: 'holder os til planen og får tingene færdige' },
    ],
  },
  {
    prompt: 'Når jeg får en ny opgave, går jeg mest op i …',
    options: [
      { style: 'analytical', label: 'at forstå hvordan og hvorfor det hænger sammen' },
      { style: 'action_oriented', label: 'at komme hurtigt i gang og se resultater' },
      { style: 'stabilizing', label: 'at have en klar og rolig plan' },
      { style: 'social', label: 'hvem jeg skal samarbejde med' },
    ],
  },
  {
    prompt: 'Mine venner ville beskrive mig som …',
    options: [
      { style: 'social', label: 'udadvendt og hjælpsom' },
      { style: 'stabilizing', label: 'rolig og pålidelig' },
      { style: 'action_oriented', label: 'energisk og målrettet' },
      { style: 'analytical', label: 'grundig og eftertænksom' },
    ],
  },
  {
    prompt: 'I en praktik glæder jeg mig mest til at …',
    options: [
      { style: 'stabilizing', label: 'blive en fast og tryg del af teamet' },
      { style: 'action_oriented', label: 'få ansvar og prøve nye ting' },
      { style: 'social', label: 'møde nye mennesker og kunder' },
      { style: 'analytical', label: 'lære faget og systemerne grundigt' },
    ],
  },
  {
    prompt: 'Når noget går galt, er min første reaktion at …',
    options: [
      { style: 'action_oriented', label: 'handle med det samme og finde en løsning' },
      { style: 'stabilizing', label: 'bevare roen og holde overblikket' },
      { style: 'analytical', label: 'undersøge hvad der gik galt' },
      { style: 'social', label: 'tale med andre om det' },
    ],
  },
  {
    prompt: 'Jeg arbejder bedst, når jeg …',
    options: [
      { style: 'analytical', label: 'kan fordybe mig i opgaven' },
      { style: 'social', label: 'er sammen med andre' },
      { style: 'stabilizing', label: 'ved præcis hvad der forventes' },
      { style: 'action_oriented', label: 'har frihed til at bestemme selv' },
    ],
  },
  {
    prompt: 'En god dag på arbejdet er, når jeg …',
    options: [
      { style: 'social', label: 'har haft gode snakke med kolleger og kunder' },
      { style: 'action_oriented', label: 'har nået mine mål' },
      { style: 'analytical', label: 'har løst en svær opgave korrekt' },
      { style: 'stabilizing', label: 'har hjulpet teamet, og alt kørte glat' },
    ],
  },
  {
    prompt: 'Jeg bliver mest motiveret af …',
    options: [
      { style: 'stabilizing', label: 'stabilitet og et godt fællesskab' },
      { style: 'analytical', label: 'at gøre tingene rigtigt' },
      { style: 'action_oriented', label: 'udfordringer og lidt konkurrence' },
      { style: 'social', label: 'anerkendelse og samvær med andre' },
    ],
  },
];

function StepDiscQuiz({
  form,
  update,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const total = DISC_QUESTIONS.length;
  const [answers, setAnswers] = useState<Record<number, BehavioralStyle>>({});
  const [current, setCurrent] = useState(0);
  const [showResult, setShowResult] = useState(
    form.primary_style !== null && form.secondary_style !== null,
  );

  const computeResult = (final: Record<number, BehavioralStyle>) => {
    const scores: Record<BehavioralStyle, number> = {
      analytical: 0,
      action_oriented: 0,
      social: 0,
      stabilizing: 0,
    };
    Object.values(final).forEach((s) => {
      scores[s] += 1;
    });
    const ranked = (Object.keys(scores) as BehavioralStyle[]).sort(
      (a, b) => scores[b] - scores[a],
    );
    update('primary_style', ranked[0]);
    update('secondary_style', ranked[1]);
  };

  const handleSelect = (style: BehavioralStyle) => {
    const next = { ...answers, [current]: style };
    setAnswers(next);
    if (current < total - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 200);
    } else {
      computeResult(next);
      setTimeout(() => setShowResult(true), 200);
    }
  };

  const retake = () => {
    setAnswers({});
    setCurrent(0);
    setShowResult(false);
    update('primary_style', null);
    update('secondary_style', null);
  };

  // ─── Result view ───────────────────────────────────────────────
  if (showResult && form.primary_style && form.secondary_style) {
    const styles: { style: BehavioralStyle; tag: string }[] = [
      { style: form.primary_style, tag: 'Primær' },
      { style: form.secondary_style, tag: 'Sekundær' },
    ];
    return (
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            className="text-5xl mb-3"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          >
            🎯
          </motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
            Din profil er <span className="gradient-text">klar!</span>
          </h1>
          <p className="text-[#94A3B8] mt-1 text-sm">
            Baseret på dine svar er dette din adfærdsstil
          </p>
        </div>

        <div className="space-y-3">
          {styles.map(({ style, tag }, i) => {
            const color = BEHAVIORAL_STYLE_COLORS[style];
            return (
              <motion.div
                key={tag}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="relative p-5 rounded-2xl border-2 glass-card"
                style={{ borderColor: color }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="text-4xl flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {BEHAVIORAL_STYLE_ICONS[style]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#F8FAFC]">
                        {BEHAVIORAL_STYLE_LABELS[style]}
                      </h3>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: `${color}30`, color }}
                      >
                        {tag}
                      </span>
                    </div>
                    <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">
                      {STYLE_DESCRIPTIONS[style]}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={retake}
          className="w-full py-3 rounded-2xl glass text-[#94A3B8] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <RotateCcw size={16} />
          Tag testen igen
        </button>
      </div>
    );
  }

  // ─── Question view ─────────────────────────────────────────────
  const q = DISC_QUESTIONS[current];
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          className="text-5xl mb-3"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🧠
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Lær din <span className="gradient-text">stil</span> at kende
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Vælg det svar, der passer bedst på dig
        </p>
      </div>

      {/* Quiz progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-[#94A3B8]">
          <span>
            Spørgsmål {current + 1} af {total}
          </span>
          <span>{Object.keys(answers).length} / {total} besvaret</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold text-[#F8FAFC] leading-snug">
            {q.prompt}
          </h2>

          <div className="space-y-2.5">
            {q.options.map((opt) => {
              const selected = answers[current] === opt.style;
              return (
                <motion.button
                  key={opt.label}
                  onClick={() => handleSelect(opt.style)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${
                    selected
                      ? 'border-2 border-violet-500/60 bg-violet-500/15'
                      : 'border border-white/10 bg-white/5 hover:bg-white/[0.08]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      selected
                        ? 'border-violet-400 bg-violet-500'
                        : 'border-white/20'
                    }`}
                  >
                    {selected && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm text-[#F8FAFC] leading-snug">
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {current > 0 && (
            <button
              onClick={() => setCurrent((c) => c - 1)}
              className="text-xs font-medium text-[#94A3B8] hover:text-[#94A3B8] flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={14} />
              Forrige spørgsmål
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  Step 4 — Video Pitch & GDPR
// ═══════════════════════════════════════════════════════════════════
function StepVideoGdpr({
  form,
  update,
  error,
}: {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  error: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [cvDragOver, setCvDragOver] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [fileError, setFileError] = useState('');

  const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
  const MAX_CV = 10 * 1024 * 1024; // 10 MB
  const CV_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const handleFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setFileError('Videoen skal være en videofil (fx MP4).');
      return;
    }
    if (file.size > MAX_VIDEO) {
      setFileError('Videoen må højst fylde 100 MB.');
      return;
    }
    setFileError('');
    update('video_file', file);
  };

  const handleCvFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const okType = CV_TYPES.includes(file.type) || /\.(pdf|docx?)$/i.test(file.name);
    if (!okType) {
      setFileError('CV skal være en PDF- eller Word-fil.');
      return;
    }
    if (file.size > MAX_CV) {
      setFileError('CV må højst fylde 10 MB.');
      return;
    }
    setFileError('');
    update('cv_file', file);
  };

  const removeVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    update('video_file', null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeCv = (e: React.MouseEvent) => {
    e.stopPropagation();
    update('cv_file', null);
    if (cvInputRef.current) cvInputRef.current.value = '';
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
          Video, CV & <span className="gradient-text">Samtykke</span>
        </h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Upload en kort videopitch, dit CV og accepter GDPR
        </p>
      </div>

      {fileError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

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
            ? 'border-violet-500 bg-violet-500/10'
            : form.video_file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-white/15 bg-white/5 hover:border-white/25'
        }`}
      >
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          aria-label="Upload videopitch"
          onChange={(e) => handleFile(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {form.video_file ? (
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-sm font-medium text-green-400">
              {form.video_file.name}
            </p>
            <p className="text-xs text-[#94A3B8]">
              {(form.video_file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              onClick={removeVideo}
              className="relative z-10 mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
            >
              <X size={12} />
              Fjern video
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Upload size={24} className="text-[#94A3B8]" />
              <Camera size={24} className="text-[#94A3B8]" />
            </div>
            <p className="text-sm text-[#94A3B8] font-medium">
              Træk en video hertil eller tryk for at uploade
            </p>
            <p className="text-xs text-[#94A3B8]">
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
            ? 'border-violet-500 bg-violet-500/10'
            : form.cv_file
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-white/15 bg-white/5 hover:border-white/25'
        }`}
      >
        <input
          ref={cvInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-label="Upload CV"
          onChange={(e) => handleCvFile(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {form.cv_file ? (
          <div className="space-y-2">
            <div className="text-3xl">📄</div>
            <p className="text-sm font-medium text-green-400">
              {form.cv_file.name}
            </p>
            <p className="text-xs text-[#94A3B8]">
              {(form.cv_file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              onClick={removeCv}
              className="relative z-10 mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
            >
              <X size={12} />
              Fjern CV
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={24} className="text-[#94A3B8] mx-auto" />
            <p className="text-sm text-[#94A3B8] font-medium">
              Upload dit CV (valgfrit)
            </p>
            <p className="text-xs text-[#94A3B8]">
              PDF eller Word
            </p>
          </div>
        )}
      </div>

      {/* GDPR */}
      <div className="rounded-2xl glass-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-violet-400 mt-0.5 flex-shrink-0" />
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
              form.gdpr_consent ? 'bg-violet-500' : 'bg-white/15'
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

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
