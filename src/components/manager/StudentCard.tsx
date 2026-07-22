'use client';

import {
  GraduationCap,
  Briefcase,
  Play,
} from 'lucide-react';
import type { Profile, BehavioralStyle } from '@/lib/types/database';
import { BEHAVIORAL_STYLE_LABELS, BEHAVIORAL_STYLE_ICONS } from '@/lib/types/database';

interface StudentCardProps {
  student: Profile;
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function StyleChip({ style }: { style: BehavioralStyle }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white backdrop-blur-md bg-white/15 border border-white/20">
      {BEHAVIORAL_STYLE_ICONS[style]} {BEHAVIORAL_STYLE_LABELS[style]}
    </span>
  );
}

export default function StudentCard({ student }: StudentCardProps) {
  const age = calculateAge(student.date_of_birth);
  const imageUrl = student.video_thumbnail_url || student.avatar_url;

  return (
    <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-[#0B0B14] border border-white/10 shadow-2xl">
      {/* Full-bleed photo or gradient fallback */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={student.full_name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-600 to-blue-600 flex items-center justify-center">
          <span className="text-[7rem] leading-none font-extrabold text-white/25 select-none">
            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      )}

      {/* Scrim for readable text */}
      <div className="absolute inset-0 card-scrim" />

      {/* Video play indicator */}
      {student.video_pitch_url && (
        <div className="absolute top-4 right-4">
          <div className="w-11 h-11 rounded-full backdrop-blur-md bg-white/15 border border-white/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Info overlaid on scrim */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-3xl font-extrabold text-white truncate">
            {student.full_name}
            {age && (
              <span className="text-2xl font-semibold text-white/80 ml-2">{age}</span>
            )}
          </h2>
          {student.education_line && (
            <p className="flex items-center gap-1.5 text-white/70 text-sm mt-1 min-w-0">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="capitalize truncate">
                {student.education_line.replace(/_/g, ' ')}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 min-w-0">
          {student.primary_style && <StyleChip style={student.primary_style} />}
          {student.secondary_style && <StyleChip style={student.secondary_style} />}
          {student.work_experience && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white backdrop-blur-md bg-white/15 border border-white/20 max-w-full min-w-0">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{student.work_experience}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
